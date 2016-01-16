(function (window) {
'use strict'

const Z_IDX_CELL_FRONT = 30
const Z_IDX_ITEM = 20
const Z_IDX_CELL_BACK = 10

class GridListDOM {

  constructor (rootElement, options) {

    this.dom = {
      root: rootElement,
      items: [],
      cells: []
    }

    this.options = options

    this.gridList = new GridList([], {
      direction: options.direction,
      lanes: options.lanes
    })

    this.updateLayout()
  }

  get vertical () {
    return this.options.direction == 'vertical'
  }

  setRootCSS () {

    this.dom.root.style.display = 'grid'

    const lanes = this.options.lanes || '6'
    const cs = this.options.cellSize || '100px'//'1fr'
    const gs = this.options.gutterSize || '10px'

    if (this.vertical) {
      Object.assign(this.dom.root.style, {
        gridTemplateColumns: `repeat(${lanes}, [col] ${cs} [gutter] ${gs})`,
        gridTemplateRows: `repeat(100, [row] ${cs} [gutter] ${gs})`
      })
    } else {
      Object.assign(this.dom.root.style, {
        gridTemplateColumns: `repeat(100, [col] ${cs} [gutter] ${gs})`,
        gridTemplateRows: `repeat(${lanes}, [row] ${cs} [gutter] ${gs})`
      })
    }
  }

  updateLayout (newOptions = {}) {
    Object.assign(this.options, newOptions)
    this.setRootCSS()
    this.resizeGrid()
    this.reconstructTargetCells()
  }

  resizeGrid () {
    this.gridList.resizeGrid(this.options.lanes)

    this.gridList.items.forEach(item => {
      Object.assign(item.element.style, {
        gridColumn: `col ${item.x+1} / span gutter ${item.w}`,
        gridRow: `row ${item.y+1} / span gutter ${item.h}`,
        zIndex: Z_IDX_ITEM
      })

    })
  }

  reconstructTargetCells () {
    // return;
    this.dom.cells.forEach(cell => this.dom.root.removeChild(cell))
    this.dom.cells = []
    const grid = this.gridList.grid
    for (let icol = 0; icol < grid.length; ++icol) {
      const column = grid[icol]
      for (let irow = 0; irow < column.length; ++irow) {
        const [col, row] = this.vertical ? [irow, icol] : [icol, irow]
        const cell = window.document.createElement('div')

        cell.classList.add('grid-cell')
        cell.gridListPos = { col, row }
        Object.assign(cell.style, {
          // border: '1px dashed red',
          gridColumn: `col ${col+1} / span gutter 1`,
          gridRow: `row ${row+1} / span gutter 1`,
          zIndex: Z_IDX_CELL_BACK
        })

        cell.addEventListener('dragenter',
                              (e) => this.onTargetCellDragEnter(e),
                              false)

        cell.ondrop = function handleDrop(e) {
          if (e.stopPropagation) {
            e.stopPropagation(); // stops the browser from redirecting.
          }
          return true;
        }


        this.dom.root.appendChild(cell)
        this.dom.cells.push(cell)
      }
    }
  }

  createTargetCell (col, row) {
    const cell = window.document.createElement('div')
    cell.classList.add('grid-cell')
    cell.gridListPos = { col, row }
    return cell
  }

  cellsToFront () {
    this.setCellLayerZIndex(Z_IDX_CELL_FRONT)
  }

  cellsToBack () {
    this.setCellLayerZIndex(Z_IDX_CELL_BACK)
  }

  setCellLayerZIndex (zIndex) {
    this.dom.cells.forEach(cell => cell.style.zIndex = zIndex)
  }

  /**
   * @param {HTMLElement} element
   * @param {{x,y,w,h}}   size
   */
  addItem(element, size) {

    this.addItem2(element, size)
    this.reconstructTargetCells()
  }

  addItem2 (element, size) {
    const item = Object.assign({}, size, {element})

    this.gridList.items.push(item)
    this.resizeGrid()

    // console.log('GRID', this.gridList, this.gridList.items, item)

    Object.assign(element.style, {
      gridColumn: `col ${item.x+1} / span gutter ${item.w}`,
      gridRow: `row ${item.y+1} / span gutter ${item.h}`,
      zIndex: Z_IDX_ITEM
    })

    this.makeDraggable(element)


    this.dom.root.appendChild(element)
    this.dom.items.push(element)

  }

  onTargetCellDragEnter (event) {

    const { col, row } = event.target.gridListPos
    const item = this.currentDrag

    console.log(`MOVE FROM ${item.x}, ${item.y} to ${col}, ${row}`)
    this.gridList.moveItemToPosition(item, [col, row])

    this.gridList.items.forEach(item => {
      Object.assign(item.element.style, {
        gridColumn: `col ${item.x+1} / span gutter ${item.w}`,
        gridRow: `row ${item.y+1} / span gutter ${item.h}`,
        zIndex: Z_IDX_ITEM
      })
    })
  }

  onItemDragStart (event) {

    event.target.style.opacity = '0.7'
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', '') // dummy payload

    this.currentDrag = this.gridList.items.find(e => e.element === event.target)
    this.cellsToFront()
  }

  makeDraggable (element) {
    //
    // element.setAttribute('draggable', 'true')
    element.draggable = true

    const that = this

    // function handleDragStart(e) {
    //   that.cellsToFront()
    //
    //
    //   const item = that.gridList.items.find(e => e.element === this)
    //
    //   e.dataTransfer.effectAllowed = 'move';
    //   e.dataTransfer.setData('text/html', item);
    //   that.currentDrag = item
    //   // e.dataTransfer.setData('text/html', 'junk');
    //   this.style.opacity = '0.4';  // this / e.target is the source node.
    // }

    function handleDragEnd (e) {
      this.style.opacity = '1.0'
      that.cellsToBack();
    }


    element.addEventListener('dragstart', (e) => this.onItemDragStart(e), false);
    element.addEventListener('dragend', handleDragEnd, false);
  }

}

window.GridListDOM = GridListDOM

})(window)
