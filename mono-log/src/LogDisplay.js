import React from 'react';
import { DataTable } from 'primereact/datatable/datatable.esm.js';
import { Column } from 'primereact/column/column.esm.js';
import { MultiSelect } from 'primereact/multiselect/multiselect.esm.js';
import { FilterMatchMode, FilterOperator } from 'primereact/api/api.esm.js';

const defaultSort = [{ field: 'ms', order: -1 }];
const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

const bodyClassName = (rowData) => ({
    debug: 'text-blue-600',
    warn: 'text-yellow-600',
    error: 'text-red-600',
}[rowData.level]);

const levels = [
    { name: 'Debug', value: 'debug' },
    { name: 'Info', value: 'info' },
    { name: 'Warn', value: 'warn' },
    { name: 'Error', value: 'error' },
];

const FORMAT = Symbol('FORMAT');
const timeBody = (rowData) => (rowData.timestamp ?? new Date(rowData.ms - timezoneOffset).toISOString())?.replace('T', ' ').substring(5, 19);
const messageBody = (rowData) => rowData?.[FORMAT] ? <pre>{JSON.stringify(rowData, undefined, 2)}</pre> : JSON.stringify(rowData);

const logLevelFilter = (options) => {
    return (
        <MultiSelect
            value={options.value ?? ''}
            options={levels}
            // itemTemplate={representativesItemTemplate}
            onChange={(e) => options.filterApplyCallback(e.value)}
            optionLabel="name"
            placeholder="Any"
            className="p-column-filter"
            maxSelectedLabels={1}
            style={{ minWidth: '14rem' }}
        />
    );
};

const toggle = state => !state;

function useToggle(initialValue = false) {
    return React.useReducer(toggle, initialValue);
}

const filters = {
    level: { value: '', matchMode: FilterMatchMode.IN },
    context: { value: '', matchMode: FilterMatchMode.IN },
    component: { value: '', matchMode: FilterMatchMode.IN },
    type: { value: '', matchMode: FilterMatchMode.IN },
    method: { value: '', matchMode: FilterMatchMode.IN }
};

const LogDisplay = ({ logMessages }) => {

    const [refresh, toggleExpanded] = useToggle(false);

    const handleCellClick = React.useCallback((e) => {
        if (e.field === 'message') {
            e.rowData[FORMAT] = !e.rowData[FORMAT];
            toggleExpanded();
        }
    }, [refresh]);

    return (
        <div className="flex-1">
            <DataTable
                value={logMessages}
                sortMode="multiple"
                sortField="ms"
                multiSortMeta={defaultSort}
                size="small"
                scrollable
                scrollHeight="flex"
                showGridlines
                removableSort
                resizableColumns
                stateStorage="local"
                stateKey="mono-log"
                // rowClassName={rowClassName}
                filters={filters}
                filterDisplay="row"
                onCellClick= {handleCellClick}
                cellSelection
            >
                <Column sortable style={{ width: "10rem" }} field="ms" header="Time"
                    body={timeBody}
                />
                <Column filter style={{ width: "10rem" }} field="level" header="Level"
                    filterElement={logLevelFilter}
                    showFilterMenu={false}
                    filterMenuStyle={{ width: '10rem' }}
                    bodyClassName={bodyClassName}
                />
                <Column style={{ width: "10rem" }} field="context" header="Context" />
                <Column style={{ width: "10rem" }} field="component" header="Component" />
                <Column style={{ width: "10rem" }} field="type" header="Type" />
                <Column style={{ width: "10rem" }} field="method" header="Method" />
                <Column style={{ width: "10rem" }} field="message" header="Message" body={messageBody} />
            </DataTable>
        </div>
    );
};

export default LogDisplay;