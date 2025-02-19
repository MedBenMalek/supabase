import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresFunction, PostgresSchema } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconLock, IconSearch, Input, Listbox } from 'ui'

import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, useStore } from 'hooks'
import FunctionList from './FunctionList'
import AlertError from 'components/ui/AlertError'

interface FunctionsListProps {
  createFunction: () => void
  editFunction: (fn: PostgresFunction) => void
  deleteFunction: (fn: PostgresFunction) => void
}

const FunctionsList = ({
  createFunction = noop,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionsListProps) => {
  const { meta } = useStore()
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [filterString, setFilterString] = useState<string>('')

  const canCreateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  const schemas: PostgresSchema[] = meta.schemas.list()
  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const functions = meta.functions.list()

  if (meta.functions.isLoading) {
    return <GenericSkeletonLoader />
  }

  if (meta.functions.hasError) {
    return (
      <AlertError error={meta.functions.error} subject="Failed to retrieve database functions" />
    )
  }

  return (
    <>
      {functions.length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Functions"
            ctaButtonLabel="Create a new function"
            onClickCta={() => createFunction()}
            disabled={!canCreateFunctions}
            disabledMessage="You need additional permissions to create functions"
          >
            <p className="text-sm text-scale-1100">
              PostgreSQL functions, also known as stored procedures, is a set of SQL and procedural
              commands such as declarations, assignments, loops, flow-of-control, etc.
            </p>
            <p className="text-sm text-scale-1100">
              It's stored on the database server and can be invoked using the SQL interface.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-[260px]">
                <Listbox
                  size="small"
                  value={selectedSchema}
                  onChange={setSelectedSchema}
                  icon={isLocked && <IconLock size={14} strokeWidth={2} />}
                >
                  <Listbox.Option
                    disabled
                    key="normal-schemas"
                    value="normal-schemas"
                    label="Schemas"
                  >
                    <p className="text-sm">Schemas</p>
                  </Listbox.Option>
                  {/* @ts-ignore */}
                  {openSchemas.map((schema) => (
                    <Listbox.Option
                      key={schema.id}
                      value={schema.name}
                      label={schema.name}
                      addOnBefore={() => <span className="text-scale-900">schema</span>}
                    >
                      <span className="text-scale-1200 text-sm">{schema.name}</span>
                    </Listbox.Option>
                  ))}
                  <Listbox.Option
                    disabled
                    key="protected-schemas"
                    value="protected-schemas"
                    label="Protected schemas"
                  >
                    <p className="text-sm">Protected schemas</p>
                  </Listbox.Option>
                  {protectedSchemas.map((schema) => (
                    <Listbox.Option
                      key={schema.id}
                      value={schema.name}
                      label={schema.name}
                      addOnBefore={() => <span className="text-scale-900">schema</span>}
                    >
                      <span className="text-scale-1200 text-sm">{schema.name}</span>
                    </Listbox.Option>
                  ))}
                </Listbox>
              </div>
              <Input
                placeholder="Filter by name"
                size="small"
                icon={<IconSearch size="tiny" />}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>

            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button disabled={!canCreateFunctions} onClick={() => createFunction()}>
                  Create a new function
                </Button>
              </Tooltip.Trigger>
              {!canCreateFunctions && (
                <Tooltip.Portal>
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                          'border border-scale-200',
                        ].join(' ')}
                      >
                        <span className="text-xs text-scale-1200">
                          You need additional permissions to create functions
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>

          <Table
            className="table-fixed"
            head={
              <>
                <Table.th key="name" className="w-1/3 space-x-4">
                  Name
                </Table.th>
                <Table.th key="arguments" className="hidden md:table-cell">
                  Arguments
                </Table.th>
                <Table.th key="return_type" className="hidden lg:table-cell">
                  Return type
                </Table.th>
                <Table.th key="buttons" className="w-1/6"></Table.th>
              </>
            }
            body={
              <FunctionList
                schema={selectedSchema}
                filterString={filterString}
                isLocked={isLocked}
                editFunction={editFunction}
                deleteFunction={deleteFunction}
              />
            }
          />
        </div>
      )}
    </>
  )
}

export default observer(FunctionsList)
