(function (window) {
'use strict'

const Z_IDX_CELL_FRONT = 30
const Z_IDX_ITEM = 20
const Z_IDX_CELL_BACK = 10

const CSS_CLASS_CELL = 'gld--grid-cell'
const CSS_CLASS_CELL_OVER = 'gld--grid-cell-over'
const CSS_CLASS_ITEM_DRAGGING = 'gld--grid-item-dragging'

const CSS_PROP_SIZE_CELL = '--gld--size-cell'
const CSS_PROP_SIZE_GAP = '--gld--size-gap'
const CSS_PROP_LANES = '--gld--lanes'

const mkCssVar = (prop) => `var(${prop})`

const CSS_VAR_SIZE_CELL = mkCssVar(CSS_PROP_SIZE_CELL)
const CSS_VAR_SIZE_GAP = mkCssVar(CSS_PROP_SIZE_GAP)
const CSS_VAR_LANES = mkCssVar(CSS_PROP_LANES)

const DIRECTION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
}

const targetCellPos = Symbol()

/**
 * Creates event handlers, bound to the given instance of GridListDOM.
 * @param {GridListDOM} gridListDOM
 * @return {Object}
 */
function createBoundEventHandlers (gridListDOM) {
  const currentDrag = Symbol()
  return {

    /**
     * Handles drag-start on element.
     * The target is the drag handle, not the element being dragged.
     * @param {DragEvent} event
     */
    onElementDragStart: function (event) {

      this.classList.add(CSS_CLASS_ITEM_DRAGGING)

      event.dataTransfer.setDragImage(this, 0, 0)
      event.dataTransfer.setData('text/html', '') // any payload is required
      event.dataTransfer.effectAllowed = 'move'

      // store item for reference when drag enters target cell
      gridListDOM[currentDrag] = gridListDOM.gridList.items.find(e => {
        return e.element === this
      })

      // pull target cells to front (for drag-enter consumption)
      // NOTE: timeout is required by Chrome
      // FIXME: find better way
      setTimeout(() => gridListDOM.cellsToFront(), 0)
    },

    /**
     * Handles drag-end on element.
     * @param {DragEvent} event
     */
    onElementDragEnd: function (event) {
      this.classList.remove(CSS_CLASS_ITEM_DRAGGING)
      gridListDOM.cellsToBack()
      gridListDOM.reconstructTargetCells()
    },

    /**
     * Handle drag-enter on target cell.
     * Element is moved physically to current target cell.
     * @param {DragEvent} event
     */
    onTargetCellDragEnter: function (event) {

      const targetCell = event.target

      targetCell.classList.add(CSS_CLASS_CELL_OVER)

      const { col, row } = targetCell[targetCellPos]
      const item = gridListDOM[currentDrag] // gridList entry node being dragged

      if (!item) {
        return
      }

      gridListDOM.gridList.moveItemToPosition(item, [col, row])
      gridListDOM.cssRelayoutItems()
    },

    /**
     * Handle drag-leave on target cell.
     * @param {DragEvent} event
     */
    onTargetCellDragLeave: function (event) {
      event.target.classList.remove(CSS_CLASS_CELL_OVER)
    },

    /**
     * Handle drag-over on target cell.
     * Just consumes event and prevents default.
     * @param {DragEvent} event
     */
    onTargetCellDragOver: function (event) {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault() // prevents feedback-image returning to the origin
    }
  }
}

const cssGrid = {

  /**
   * Initializes root as a grid container.
   * @param {HTMLElement} root
   * @param {boolean} isVertical
   */
  initializeRoot: function (root, isVertical) {

    Object.assign(root.style, {
      display: 'grid',
      gridGap: CSS_VAR_SIZE_GAP
    })

    // there is no need to limit the lanes on the grid,
    // since these are trimmed and grid size is limited by GridList.
    root.style.setProperty(CSS_PROP_LANES, '100')

    // FIXME: dumb chrome does not support auto-fill, 100 is used;
    // this prevents using '1fr' for cell-size.

    Object.assign(root.style, isVertical ? {
      gridTemplateColumns: `repeat(${CSS_VAR_LANES}, [col] ${CSS_VAR_SIZE_CELL})`,
      // gridTemplateRows: `repeat(auto-fill, [row] ${CSS_VAR_SIZE_CELL})`
      gridTemplateRows: `repeat(100, [row] ${CSS_VAR_SIZE_CELL})`
    } : {
      // gridAutoColumns: `repeat(auto-fill, [col] ${CSS_VAR_SIZE_CELL})`,
      gridAutoColumns: `repeat(100, [col] ${CSS_VAR_SIZE_CELL})`,
      gridTemplateRows: `repeat(${CSS_VAR_LANES}, [row] ${CSS_VAR_SIZE_CELL})`
    })
  },

  /**
   * Places element on the grid by modifying CSS.
   * @param {HTMLElement} element
   * @param {{x: number, y: number, w: number, h: number, z: number}} position
   */
  placeElement: function (element, position) {
    Object.assign(element.style, {
      gridColumn: `col ${position.x+1} / span ${position.w}`,
      gridRow: `row ${position.y+1} / span ${position.h}`,
      zIndex: position.z
    })
  }
}

class GridListDOM {

  /**
   * @param {HTMLElement} rootElement
   * @param {Object} options
   */
  constructor (rootElement, options) {

    Object.defineProperty(options, 'isVertical', {
      get: function () { return this.direction === DIRECTION.VERTICAL }
    })

    /** @private */
    this.dom = {
      root: rootElement,
      cells: []
    }

    /** @private */
    this.options = options

    /** @private */
    this.gridList = new GridList([], options)

    /** @private */
    this.events = createBoundEventHandlers(this)

    this.updateLayout()
  }

  /**
   * @private
   */
  updateLayout (newOptions = {}) {
    Object.assign(this.options, newOptions)
    cssGrid.initializeRoot(this.dom.root, this.options.isVertical)
    this.resizeGrid()
  }

  /**
   * Updates position of each element according to the grid setup.
   * @private
   */
  cssRelayoutItems () {
    this.gridList.items.forEach(({ element, x, y, w, h }) => {
      cssGrid.placeElement(element, { x, y, w, h, z: Z_IDX_ITEM })
    })
  }

  /**
   * Adds node to the grid.
   * @param {HTMLElement} node
   * @param {{x: number, y: number, w: number, h: number}} position
   * @public
   */
  appendGridElement(node, position) {

    const item = Object.assign({}, position, { element: node })
    this.gridList.items.push(item)
    this.makeDraggable(node)
    this.dom.root.appendChild(node)
    this.resizeGrid()
  }

  /**
   * Removes node from the grid.
   * @param {HTMLElement} node
   * @public
   */
  removeGridElement (node) {

    const index = this.gridList.items.findIndex(e => e.element === node)

    if (index > -1) {
      this.gridList.items.splice(index, 1)
      this.dom.root.removeChild(node)
      this.resizeGrid()
    }
  }

  /**
   * Resizes the node.
   * @param {HTMLElement} node
   * @param {{w: number, h: number}} size
   * @public
   */
  resizeGridElement (node, size) {

    const item = this.gridList.items.find(e => e.element === node)

    if (item) {
      this.gridList.resizeItem(item, size)
      this.resizeGrid()
    }
  }

  /**
   * Resizes the grid. Called whenever element is added.
   * If called without arguments, size remains the same
   * and items are repositioned and collisions are resolved.
   * @param {number} lanes
   * @public
   */
  resizeGrid (lanes) {

    this.options.lanes = lanes || this.options.lanes
    this.gridList.resizeGrid(this.options.lanes)

    this.cssRelayoutItems()
    this.reconstructTargetCells()
  }

  /**
   * Attaches dragging events to element.
   * @param {HTMLElement} element
   * @private
   */
  makeDraggable (element) {
    element.addEventListener('dragstart', this.events.onElementDragStart, true)
    element.addEventListener('dragend', this.events.onElementDragEnd)
  }

  /**
   * Recreates and lays-out target cells.
   * @private
   */
  reconstructTargetCells () {

    // TODO: consider re-using existing cells

    this.dom.cells.forEach(cell => this.dom.root.removeChild(cell))
    this.dom.cells = []

    const lanes = this.options.lanes
    const perp = this.gridList.grid.length + 1
    const [cols, rows] = this.options.isVertical ? [lanes, perp] : [perp, lanes]

    for (let col = 0; col < cols; ++col) {
      for (let row = 0; row < rows; ++row) {
        const cell = this.createTargetCell()
        this.positionTargetCell(cell, col, row)
        this.dom.root.appendChild(cell)
        this.dom.cells.push(cell)
      }
    }
  }

  /**
   * Creates new target cell.
   * @return {HTMLElement}
   * @private
   */
  createTargetCell () {
    const cell = window.document.createElement('div')
    cell.addEventListener('dragenter', this.events.onTargetCellDragEnter)
    cell.addEventListener('dragleave', this.events.onTargetCellDragLeave)
    cell.addEventListener('dragover', this.events.onTargetCellDragOver)
    cell.classList.add(CSS_CLASS_CELL)
    return cell
  }

  /**
   * @private
   */
  positionTargetCell (cell, col, row) {
    cell[targetCellPos] = { col, row }
    const position = { x: col, y: row, w: 1, h: 1, z: Z_IDX_CELL_BACK }
    cssGrid.placeElement(cell, position)
  }

  /**
   * @private
   */
  cellsToFront () {
    this.setCellLayerZIndex(Z_IDX_CELL_FRONT)
  }

  /**
   * @private
   */
  cellsToBack () {
    this.setCellLayerZIndex(Z_IDX_CELL_BACK)
  }

  /**
   * @private
   */
  setCellLayerZIndex (zIndex) {
    this.dom.cells.forEach(cell => cell.style.zIndex = zIndex)
  }
}

window.GridListDOM = GridListDOM

})(window)
