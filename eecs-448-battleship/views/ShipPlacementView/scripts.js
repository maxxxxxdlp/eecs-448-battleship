'use strict';

// The name of this view
// Later, to render this view, call:
// new ShipPlacementView(options).render(this.container)

/**
 * Base ShipPlacementView class
 * @class ShipPlacementView
 * @constructor
 * @param options
 * @extends View
 * @public
 */
class ShipPlacementView extends View {
  constructor(options) {
    super(options);
    this.currentShip = undefined;
    this.currentShipSize = undefined;
    this.isValidPlacement = false;
    this.orientatioon = 'horizontal';
    this.shipShadow = undefined;

    this.handleBoardCellOver = this.handleBoardCellOver.bind(this);
    this.handleBoardCellOut = this.handleBoardCellOut.bind(this);
    this.handleBoardCellClick = this.handleBoardCellClick.bind(this);
    this.handleSelectedShipChange = this.handleSelectedShipChange.bind(this);
    this.handleRotateShip = this.handleRotateShip.bind(this);
    this.handleFinishPlacement = this.handleFinishPlacement.bind(this);
    this.handleAIGamePlacement = this.handleAIGamePlacement.bind(this);
  }

  /**
   * Renders a defined view into a container. Passes in necessary, predefined
   * render parameters.
   * @async
   * @function render
   * @memberof ShipPlacementView
   * @param container Container to render the view within
   */
  async render(
    // Container would be populated with elements from index.html
    container
  ) {
    await super.render(container);

    /* Render the 9x10 grid */
    this.board = await new Board({
      rows,
      cols,
      tagName: 'section',
      onMouseOver: this.handleBoardCellOver,
      onMouseOut: this.handleBoardCellOut,
      onClick: this.handleBoardCellClick,
    }).render(this.container.getElementsByClassName('board')[0]);

    /* Render between 1 and 6 ships on the sidebar */
    this.fleet = await new Fleet({
      numberOfShips: this.options.numberOfShips,
      onChange: this.handleSelectedShipChange,
    }).render(this.container.getElementsByClassName('fleet')[0]);

    this.rotateButton = this.container.getElementsByClassName('rotate')[0];
    this.rotateButton.addEventListener('click', this.handleRotateShip);

    this.finishButton = this.container.getElementsByClassName('finish')[0];
    this.finishButton.addEventListener('click', this.handleFinishPlacement);

    this.AIGameButtonEasy = this.container.getElementsByClassName('AIGame')[0];
    this.AIGameButtonEasy.addEventListener('click', () => {
      this.options.difficulty = 'easy';
      this.handleAIGamePlacement();
    }
    );

    this.AIGameButtonMedium = this.container.getElementsByClassName('AIGame')[1];
    this.AIGameButtonMedium.addEventListener('click', () => {
      this.options.difficulty = 'medium';
      this.handleAIGamePlacement();
    }
    );

    this.AIGameButtonHard = this.container.getElementsByClassName('AIGame')[2];
    this.AIGameButtonHard.addEventListener('click', () => {
      this.options.difficulty = 'hard';
      this.handleAIGamePlacement();
    }
    );

    return this;
  }
  
  // Allow selecting a ship and putting it on the board
  /**
   * Handle changing a selected ship
   * @function handleSelectedShipChange
   * @param {object} target
   * @memberof ShipPlacementView
   * @public 
   */
  handleSelectedShipChange({ target }) {
    this.currentShip = target;
    this.currentShipSize = getElementIndex(target.parentElement) + 1;
  }

  /**
   * Ship rotation handling for ship placement
   * @function handleRotateShip
   * @memberof ShipPlacementView
   * @public  
   */
  handleRotateShip() {
    const isToggled = this.orientatioon === 'vertical';
    this.orientatioon = isToggled ? 'horizontal' : 'vertical';
    this.rotateButton.ariaPressed = isToggled;
  }

  /**
   * Handle mouse over cell
   * @function handleBoardCellOver
   * @param {options}
   * @param row
   * @param column 
   * @memberof ShipPlacementView
   * @public  
   */  
  handleBoardCellOver({ row, col }) {
    if (typeof this.currentShipSize !== 'number' || this.currentShip.disabled)
      return;
    this.shipShadow = Array.from({
      length: this.orientatioon === 'vertical' ? this.currentShipSize : 1,
    }).flatMap((_, rowIndex) =>
      Array.from({
        length: this.orientatioon === 'horizontal' ? this.currentShipSize : 1,
      }).map((_, colIndex) => [row + rowIndex, col + colIndex])
    );
    this.isValidPlacement = this.shipShadow.every(
      ([row, col]) =>
        typeof this.board.cells[row]?.[col] !== 'undefined' &&
        getAllNeighbourCells(row, col).every(
          ([row, col]) =>
            this.board.cells[row]?.[col]?.classList.contains('ship') !== true
        )
    );

    this.handleBoardCellOut();
    this.shipShadow.forEach(([row, col]) =>
      this.board.cells[row]?.[col]?.classList.add(
        this.isValidPlacement ? 'shadow' : 'invalid'
      )
    );
  }

  /**
   * Handle mouse leaving cell
   * @function handleBoardCellOut
   * @memberof ShipPlacementView
   * @public  
   */ 
  handleBoardCellOut() {
    this.board.cells.flat().map((cell) => {
      cell.classList.remove('shadow');
      cell.classList.remove('invalid');
    });
  }

  /**
   * Click handling for cells / placement
   * @function handleBoardCellClick
   * @memberof ShipPlacementView
   * @public  
   */ 
  handleBoardCellClick() {
    if (!this.isValidPlacement) return;
    this.isValidPlacement = false;

    this.handleBoardCellOut();
    this.shipShadow.forEach(([row, col]) => {
      this.board.cells[row][col].classList.remove('shadow');
      this.board.cells[row][col].classList.remove('invalid');
      this.board.cells[row][col].classList.add('ship');
    });

    this.currentShip.disabled = true;
    this.finishButton.disabled &&= !this.fleet.ships.every(
      (input) => input.disabled
    );

    this.AIGameButtonEasy.disabled &&= !this.fleet.ships.every(
      (input) => input.disabled
    );

    this.AIGameButtonMedium.disabled &&= !this.fleet.ships.every(
      (input) => input.disabled
    );

    this.AIGameButtonHard.disabled &&= !this.fleet.ships.every(
      (input) => input.disabled
    );
  }

  /**
   * Render game board once finished
   * @function handleFinishPlacement
   * @memberof ShipPlacementView
   * @public  
   */ 
  handleFinishPlacement() {
    new GameBoardView({
      numberOfShips: this.options.numberOfShips,
      board: this.board.cells.map((row) =>
        row.map((cell) => cell.classList.contains('ship'))
      ),
    }).render(this.container);
  }

  handleAIGamePlacement() {
    new AIGameBoardView({//this is where we go to game board view, need to change this to got to AIGameBoardView
      numberOfShips: this.options.numberOfShips,
      difficulty: this.options.difficulty,
      board: this.board.cells.map((row) =>
        row.map((cell) => cell.classList.contains('ship'))
      ),
    }).render(this.container);
  }

  /**   
   * View remove function for ephemeral objects, ie. eventListeners
   * @function remove
   * @memberof ShipPlacementView
   */
  remove() {
    super.remove();

    this.board.remove();
    this.fleet.remove();

    this.rotateButton.removeEventListener('click', this.rotateShip);
  }
}
