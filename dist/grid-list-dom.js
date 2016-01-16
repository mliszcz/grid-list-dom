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
    this.reconstructCells()
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

  reconstructCells () {
    // return;
    this.dom.cells.forEach(cell => this.dom.root.removeChild(cell))
    this.dom.cells = []
    const grid = this.gridList.grid
    for (let icol = 0; icol < grid.length; ++icol) {
      const column = grid[icol]
      for (let irow = 0; irow < column.length; ++irow) {
        const [col, row] = this.vertical ? [irow, icol] : [icol, irow]
        const cell = window.document.createElement('div')
        cell.draggable = true
        cell.classList.add('grid-cell')
        cell.gridListPos = { col, row }
        Object.assign(cell.style, {
          // border: '1px dashed red',
          gridColumn: `col ${col+1} / span gutter 1`,
          gridRow: `row ${row+1} / span gutter 1`,
          zIndex: Z_IDX_CELL_BACK
        })
        this.makeCellTarget(cell)
        this.dom.root.appendChild(cell)
        this.dom.cells.push(cell)
      }
    }
  }

  cellsToFront () {
    this.setCellLayerZIndex(Z_IDX_CELL_FRONT)
  }

  cellsToBack () {
    this.setCellLayerZIndex(Z_IDX_CELL_BACK)
  }

  setCellLayerZIndex (zIndex) {
    this.dom.cells.forEach(cell => {
      cell.style.zIndex = zIndex
    })
  }

  /**
   * @param {HTMLElement} element
   * @param {{x,y,w,h}}   size
   */
  addItem(element, size) {

    this.addItem2(element, size)
    this.reconstructCells()
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

  // removeItem (element) {
  //   const gridList = this.gridList
  //   const gridListIdx = gridList.items.findIndex(e => e.element === element)
  //   gridList.items.splice(gridListIdx, 1)
  //   this.dom.items.splice(this.dom.items.indexOf(element), 1)
  //   this.dom.root.removeChild(element)
  // }

  makeCellTarget (element) {

const that = this

    function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }

  e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.

  return false;
}

function handleDragEnter(e) {
  // console.log('dragenter', this)
  // this / e.target is the current hover target.
  this.classList.add('over');


  const { col, row } = this.gridListPos

  // const item = e.dataTransfer.getData('text/html')
  const item = that.currentDrag

  // item.x = col
  // item.y = row

  console.log(`MOVE FROM ${item.x}, ${item.y} to ${col}, ${row}`)
  that.gridList.moveItemToPosition(item, [col, row])

  that.gridList.items.forEach(item => {
    Object.assign(item.element.style, {
      gridColumn: `col ${item.x+1} / span gutter ${item.w}`,
      gridRow: `row ${item.y+1} / span gutter ${item.h}`,
      zIndex: Z_IDX_ITEM
    })

  })

  // that.gridList.items.push(item)

  console.log('ITEM', item)

  // Object.assign(item.element.style, {
  //   gridColumn: `col ${item.x+1} / span gutter ${item.w}`,
  //   gridRow: `row ${item.y+1} / span gutter ${item.h}`,
  //   zIndex: Z_IDX_ITEM
  // })

  // that.resizeGrid()

  // console.log(that.gridList)



}

function handleDragLeave(e) {
  this.classList.remove('over');  // this / e.target is previous target element.

  // that.gridList.items.splice(that.gridList.items.indexOf(that.currentDrag), 1)
}


function handleDrop(e) {
  // this / e.target is current target element.

  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }

  // See the section on the DataTransfer object.

  return false;
}

element.addEventListener('dragover', handleDragOver, false);
element.addEventListener('dragenter', handleDragEnter, false);
element.addEventListener('dragleave', handleDragLeave, false);
element.addEventListener('drop', handleDrop, false);

  }

  makeDraggable (element) {
    //
    // element.setAttribute('draggable', 'true')
    element.draggable = true

    const that = this

    function handleDragStart(e) {
      that.cellsToFront()


      const item = that.gridList.items.find(e => e.element === this)
      // const gridListIdx = that.gridList.items.findIndex(e => e.element === this)
      // that.gridList.items.splice(gridListIdx, 1)
      //
      // that.resizeGrid()


      // console.log('dragstert', e)

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item);
      that.currentDrag = item
      // e.dataTransfer.setData('text/html', 'junk');
      this.style.opacity = '0.4';  // this / e.target is the source node.
    }

    function handleDragEnd (e) {
      this.style.opacity = '1.0'
      that.cellsToBack();

      [].forEach.call(that.dom.cells, function (col) {
        col.classList.remove('over');
      });
    }


    element.addEventListener('dragstart', handleDragStart, false);
    element.addEventListener('dragend', handleDragEnd, false);


    // element.ondragover = handleDragOver
    // element.ondragenter = handleDragEnter
    // element.ondragleave = handleDragLeave

  }

}

window.GridListDOM = GridListDOM

})(window)
