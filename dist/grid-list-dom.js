(function (window) {
'use strict'

const Z_IDX_CELL_FRONT = 30
const Z_IDX_ITEM = 20
const Z_IDX_CELL_BACK = 10

const CSS_CLASS_CELL = 'gld--grid-cell'
const CSS_CLASS_CELL_OVER = 'gld--grid-cell-over'

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

    this.targetCellEvents = {
      dragEnter: (event) => this.onTargetCellDragEnter(event),
      dragLeave: (event) => this.onTargetCellDragLeave(event),
      dragOver: (event) => this.onTargetCellDragOver(event)
    }

    this.updateLayout()
  }

  get isVertical () {
    return this.options.direction == 'vertical'
  }

  setRootGridCSS () {

    this.dom.root.style.display = 'grid'

    const lanes = this.options.lanes || '6'
    const cs = this.options.cellSize || '100px'//'1fr'
    const gs = this.options.gutterSize || '10px'

    if (this.isVertical) {
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

  placeElementOnGridCSS (element, x, y, w, h, z) {
    Object.assign(element.style, {
      gridColumn: `col ${x+1} / span gutter ${w}`,
      gridRow: `row ${y+1} / span gutter ${h}`,
      zIndex: z
    })
  }

  updateLayout (newOptions = {}) {
    Object.assign(this.options, newOptions)
    this.setRootGridCSS()
    this.resizeGrid()
    this.relayoutItems()
    this.reconstructTargetCells()
  }

  /** Resizes the grid. Called whenever element is added.
   * @private
   */
  resizeGrid () {
    this.gridList.resizeGrid(this.options.lanes)
  }

  /** Updates position of each element according to the grid setup.
   * @private
   */
  relayoutItems () {
    this.gridList.items.forEach(({element, x, y, w, h}) => {
      this.placeElementOnGridCSS(element, x, y, w, h, Z_IDX_ITEM)
    })
  }

  /** Adds new element to the grid.
   * @param {HTMLElement} element
   * @param {{x,y,w,h}}   size
   */
  addItem(element, size) {

    const item = Object.assign({}, size, {element})
    this.makeDraggable(element)

    this.gridList.items.push(item)
    this.resizeGrid()
    this.relayoutItems()

    this.dom.root.appendChild(element)
    this.dom.items.push(element)

    this.reconstructTargetCells()
  }

  onItemDragStart (event) {

    event.target.style.opacity = '0.7'
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', '') // dummy payload

    console.log('FINSDIN', event.target)

    this.currentDrag = this.gridList.items.find(e => e.element === event.target)

    setTimeout(() => {
      // timeout required by Chrome
      this.cellsToFront()
    }, 0)

  }

  onItemDragEnd (event) {

  }

  makeDraggable (element) {
    //
    // element.setAttribute('draggable', 'true')
    // element.draggable = true

    // element.childNodes[0].draggable = 'true'
    element.childNodes[0].draggable = true
    element.childNodes[0].ondragstart = (e) => {
      console.log('HANDLE RECEIVED', e)
      // element.draggable = true
      // // e.preventDefault()
      // console.log('FIREF DEOM CHILD')
      e.dataTransfer.setDragImage(element, 0, 0)
      this.onItemDragStart({
        target: element,
        dataTransfer: e.dataTransfer
      })

      // e.preventDefault()

      // return false
      // console.log('RETURNING')
    }

    const that = this


    function handleDragEnd (e) {
      console.log('DRAGEND')
      this.style.opacity = '1.0'
      that.cellsToBack();
    }

    element.childNodes[0].ondragend = (e) => {
      console.log('DRAGEND')
      element.style.opacity = '1.0'
      this.cellsToBack()
      this.reconstructTargetCells()
    }


    // element.addEventListener('dragstart', (e) => {
    //   console.log('ROOT RECEIVED')
    //   this.onItemDragStart(e)
    // }, false);
    // element.addEventListener('dragend', handleDragEnd, false);
  }


  /** (re-)Creates and lays out target cells.
   * @private
   */
  reconstructTargetCells () {

    // TODO: reuse existing cells
    this.dom.cells.forEach(cell => this.dom.root.removeChild(cell))
    this.dom.cells = []

    const lanes = this.options.lanes
    const perp = this.gridList.grid.length + 1
    const [cols, rows] = this.isVertical ? [lanes, perp] : [perp, lanes]

    for (let col = 0; col < cols; ++col) {
      for (let row = 0; row < rows; ++row) {
        const cell = this.createTargetCell()
        this.positionTargetCell(cell, col, row)
        this.dom.root.appendChild(cell)
        this.dom.cells.push(cell)
      }
    }
  }

  /** Creates new targetCell.
   * @return {HTMLElement}
   * @private
   */
  createTargetCell () {
    const cell = window.document.createElement('div')
    cell.addEventListener('dragenter', this.targetCellEvents.dragEnter)
    cell.addEventListener('dragleave', this.targetCellEvents.dragLeave)
    cell.addEventListener('dragover', this.targetCellEvents.dragOver)
    cell.classList.add(CSS_CLASS_CELL)
    return cell
  }

  /** @private */
  positionTargetCell (cell, col, row) {
    cell.gridListCellPos = { col, row }
    this.placeElementOnGridCSS(cell, col, row, 1, 1, Z_IDX_CELL_BACK)
  }

  /** @private */
  cellsToFront () {
    this.setCellLayerZIndex(Z_IDX_CELL_FRONT)
  }

  /** @private */
  cellsToBack () {
    this.setCellLayerZIndex(Z_IDX_CELL_BACK)
  }

  /** @private */
  setCellLayerZIndex (zIndex) {
    this.dom.cells.forEach(cell => cell.style.zIndex = zIndex)
  }

  /** @private */
  onTargetCellDragEnter (event) {

    event.target.classList.add(CSS_CLASS_CELL_OVER)

    console.log('ENTER DRAG AREA')

    const { col, row } = event.target.gridListCellPos
    const item = this.currentDrag

    if (!item) {
      return
    }

    console.log(`MOVE FROM ${item.x}, ${item.y} to ${col}, ${row}`)
    this.gridList.moveItemToPosition(item, [col, row])

    this.relayoutItems()

    // this.gridList.items.forEach(item => {
    //   Object.assign(item.element.style, {
    //     gridColumn: `col ${item.x+1} / span gutter ${item.w}`,
    //     gridRow: `row ${item.y+1} / span gutter ${item.h}`,
    //     zIndex: Z_IDX_ITEM
    //   })
    // })
  }

  /** @private */
  onTargetCellDragOver (event) {

    // prevents feedback-image returning to the origin
    if (event.preventDefault) {
      event.preventDefault()
    }
    event.dataTransfer.dropEffect = 'move'
  }

  /** @private */
  onTargetCellDragLeave (event) {
    event.target.classList.remove(CSS_CLASS_CELL_OVER)
  }
}

window.GridListDOM = GridListDOM

})(window)
