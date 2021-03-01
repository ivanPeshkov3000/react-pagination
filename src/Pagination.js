import { useReducer } from "react";
import './Pagination.css';
import Data from './MOCK_DATA.json';


export default function PaginationContainer() {
  const initialState = {
    pagesCount: 1,
    currentPage: 1,
    pageSize: 20,
    totalItemsCount: Data.length,
    data: Data,
    currentChunkData: []
  }
  
  const [state, dispatch] = useReducer(reducer, initialState, init);

  function init(state) {
    return {
      ...state,
      pagesCount: Math.ceil(state.totalItemsCount / state.pageSize),
      currentChunkData: state.data.slice(state.pageSize * (state.currentPage - 1), state.pageSize * state.currentPage)
    }
  }

  function reducer(state, action) {
    switch (action.type) {
      case 'setPage':
        return {
          ...state,
          currentPage: action.value,
          currentChunkData: state.data.slice(state.pageSize * (action.value - 1), state.pageSize * action.value)
        }
      case 'resizePage':
        const upd = {
          size: action.value,
          count: Math.ceil(state.totalItemsCount / action.value),
          current: 0,
          curData: []
        }
        upd.current = state.pagesCount < upd.count
          ? Math.floor(state.currentPage / state.pagesCount * upd.count)
          : Math.ceil(state.currentPage / state.pagesCount * upd.count);

        upd.curData = state.data.slice(upd.size * (upd.current - 1), upd.size * upd.current);

        return {
          ...state,
          pageSize: upd.size,
          pagesCount: upd.count,
          currentPage: upd.current,
          currentChunkData: upd.curData
        }
      case 'sortData':
        const collator = new Intl.Collator(['en', 'ru'], { numeric: true });
        const orderBy = action.order;
        const sortedData = state.data.slice().sort((a, b) => orderBy * collator.compare(a[action.value], b[action.value]));
        return {
          ...state,
          data: sortedData,
          currentChunkData: sortedData.slice(state.pageSize * (state.currentPage - 1), state.pageSize * state.currentPage)
        }
      case 'filterData':
        const filteredData = Data.filter(row => JSON.stringify(row).indexOf(action.value) !== -1)
        return {
          ...state,
          data: filteredData,
          totalItemsCount: filteredData.length,
          currentPage: 1,
          pagesCount: Math.ceil(filteredData.length / state.pageSize),
          currentChunkData: filteredData.slice(0, state.pageSize)
        }
      default:
        throw new Error();
    }
  }
  return (
    <PaginationPureComponent state={state} dispatch={dispatch} />
  )  
}

function PaginationPureComponent({state, dispatch}) {
  return (
    <div className="Pagination">
      <header className="header">
        <input className="search-input" placeholder="Enter name of property" onChange={ev => dispatch({ type: "filterData", value: ev.target.value })} />
      </header>
      <main className="main">
        <PageList pagesCount={state.pagesCount} activePage={state.currentPage} handle={val => dispatch({ type: "setPage", value: val })} />
        <div className="page-sizing">
          <span className="description-pagesize">
            Количество строк:
          </span>
          <SelectSize optionValues={[10, 20, 35, 50]} defaultValue={state.pageSize} handle={val => dispatch({ type: "resizePage", value: val })} />
        </div>
        <TableOfData data={state.currentChunkData} handleSort={(col, ord) => dispatch({ type: "sortData", value: col, order: ord })} />
        <PageList pagesCount={state.pagesCount} activePage={state.currentPage} handle={val => dispatch({ type: "setPage", value: val })} />
      </main>
    </div>
  );
}

/**********************************
 * Меню изменения размера страницы
**********************************/
function SelectSize({ optionValues, handle, defaultValue = 20 }) {
  const options = optionValues.map(value => {
    return ( <option key={value}>{value}</option> )
  });

  return (
    <select className="select-pagesize" defaultValue={defaultValue} onChange={ev => handle(ev.target.value)}>
      {options}
    </select>
  )
}

/*****************************
 * Таблица с данными
*****************************/
function TableOfData({ data, handleSort }) {
  if (!data || !data.length) return (
    <span className="empty-table">No matches</span>
  )
  const columns = data.reduce((keys, row) => {
      const rowKeys = Object.keys(row);
      const emerge = rowKeys.filter(prop => keys.indexOf(prop) < 0);

      if (emerge) keys.push(...emerge)
      return keys;
    },
    Object.keys(data[0])
  );

  function checkOrder(target) {
    target.parentNode.childNodes.forEach(child => {
      child !== target
        ? (child.dataset.order = "")
        : (target.dataset.order = -child.dataset.order || 1)
    });
  };
  const tHead = [];
  columns.forEach(column => {
    tHead.push(
      <td
        key={column}
        data-column={column}
        onClick={
          ev => {
            checkOrder(ev.target);
            handleSort(ev.target.dataset.column, ev.target.dataset.order)
          }
        }
      >
        {column.toUpperCase()}
      </td>)
  });

  const items = data.map((item) => {
    const trContent = [];

    columns.forEach(column => {
      trContent.push(
        <td key={column + item.id}>
          {item[column] !== undefined ? item[column].toString() : <span className="empty">Empty</span>}
        </td>
      )
    })

    return (
      <tr key={item._id}>{trContent}</tr>
    )
  });

  return (
    <div className="table-container">
      <table className="info-table">
        <thead>
          <tr>
            {tHead}
          </tr>
        </thead>
        <tbody>
          {items}
        </tbody>
      </table>
    </div>
  )
}

/*****************************
 * Блок навигации по страницам
*****************************/
function PageList({pagesCount = 2, activePage = 1, handle = () => {}}) {
  const items = [];

  for (let i = 1; i <= pagesCount; i++) {
    items.push(<li key={i} page={i} className={i === Number(activePage) ? "active" : ""} onClick = {ev => handle(ev.target.attributes.page.value)}>{i}</li>);
  }

  return (
    <ol className = "pagelist">
      {items}
    </ol>
  )
}


