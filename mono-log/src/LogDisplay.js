import React from 'react';
import { DataTable } from 'primereact/datatable/datatable.esm.js';
import { Column } from 'primereact/column/column.esm.js';
import { MultiSelect } from 'primereact/multiselect/multiselect.esm.js';

const defaultSort = [{ field: 'ms', order: -1 }];
const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

const bodyClassName = (rowData) => ({
    debug: 'text-blue-600',
    warn: 'text-yellow-600',
    error: 'text-red-600',
}[rowData.level]);

const FORMAT = Symbol('FORMAT');
const timeBody = (rowData) => (rowData.timestamp ?? new Date(rowData.ms - timezoneOffset).toISOString())?.replace('T', ' ').substring(5, 19);
const string = (value) => {
    if (value === undefined) {
        return '';
    } else if (typeof value === 'string') {
        return value;
    } else return JSON.stringify(value);
}
const stringBody = (rowData, options) => string(rowData[options.field]);

const format = (data) => {
    if (typeof data === 'object') {
        return Object.keys(data).map(key => {
            return (
                <div key={key} style={{ marginLeft: '1rem', whiteSpace: 'pre-wrap'}}>
                    <span className='text-blue-600'>{key}</span>: {format(data[key])}
                </div>
            );
        });
    } else {
        return <span className={typeof data === 'string' ? '' : 'text-green-600'}>{string(data)}</span>;
    }
}

const messageBody = (rowData) => rowData?.[FORMAT] ? format(rowData) : (string(rowData?.message) ?? JSON.stringify(rowData));

const filterElement = levels => (options) => {
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
            style={{ minWidth: '4rem' }}
        />
    );
};

const toggle = state => !state;

function useToggle(initialValue = false) {
    return React.useReducer(toggle, initialValue);
}

const LogDisplay = ({ logMessages, dropDowns, filters }) => {

    const [refresh, toggleExpanded] = useToggle(false);

    const handleCellClick = React.useCallback((e) => {
        if (e.field === 'level') {
            e.rowData[FORMAT] = !e.rowData[FORMAT];
            toggleExpanded();
        }
    }, [refresh]);

    const filterElements = React.useMemo(() => Object.keys(filters).reduce((options, key) => {
        if (dropDowns[key]) {
            options[key] = filterElement(Array.from(dropDowns[key]).map(value => ({ name: value, value })));
        }
        return options;
    }, {}), [Object.values(dropDowns).map(set => Array.from(set).sort().join()).join()]);

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
                onCellClick={handleCellClick}
                cellSelection
            >
                <Column sortable style={{ width: "10rem" }} field="ms" header="Time"
                    body={timeBody}
                />
                <Column style={{ width: "10rem" }} field="level" header="Level"
                    filter
                    filterElement={filterElements.level}
                    showFilterMenu={false}
                    bodyClassName={bodyClassName}
                    body={stringBody}
                />
                <Column style={{ width: "10rem" }} field="context" header="Context"
                    filter
                    filterElement={filterElements.context}
                    showFilterMenu={false}
                    body={stringBody}
                />
                <Column style={{ width: "10rem" }} field="component" header="Component"
                    filter
                    filterElement={filterElements.component}
                    showFilterMenu={false}
                    body={stringBody}
                />
                <Column style={{ width: "10rem" }} field="type" header="Type"
                    filter
                    filterElement={filterElements.type}
                    showFilterMenu={false}
                    body={stringBody}
                />
                <Column style={{ width: "10rem" }} field="method" header="Method"
                    filter
                    filterElement={filterElements.method}
                    showFilterMenu={false}
                    body={stringBody}
                />
                <Column style={{ width: "10rem" }} field="message" header="Message" body={messageBody} />
            </DataTable>
        </div>
    );
};

export default LogDisplay;