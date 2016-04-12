//Globel variable
var MAX_RUNS = 40;

// helper functions
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function AgentBrain(gameEngine) {
    this.size = 4;
    this.previousState = gameEngine.grid.serialize();
    this.reset();
    this.score = 0;
};

AgentBrain.prototype.reset = function () {
    this.score = 0;
    this.grid = new Grid(this.previousState.size, this.previousState.cells);
};

// Adds a tile in a random position
AgentBrain.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

AgentBrain.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
AgentBrain.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;
    
//    this.setMergedFrom();
    //console.log(vector);

    //console.log(traversals);

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);
            
            
            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });
    
    if (moved) {
        this.addRandomTile();
    }
    return moved;
};

//set mergefrom to null
//AgentBrain.prototype.setMergedFrom = function(){
//	this.grid.eachCell(function(x, y , tile){
//		if(tile) {
//			tile.mergedFrom = null;
//			
//			tile.savePosition();
//		}
//	});
//};

// Get the vector representing the chosen direction
AgentBrain.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0, y: -1 }, // Up
        1: { x: 1, y: 0 },  // Right
        2: { x: 0, y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
AgentBrain.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

AgentBrain.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
             this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

AgentBrain.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

function clone(brain, gameManager){
	var cloneBrain = new AgentBrain(gameManager);
	cloneBrain.score = brain.score;
	cloneBrain.size = brain.size;
	cloneBrain.previousState = brain.previousState;
	return cloneBrain;
};

function Agent() {
};

Agent.prototype.selectMove = function (gameManager) {
    var brain = new AgentBrain(gameManager);
//    brain.reset();
    // Use the brain to simulate moves
    // brain.move(i) 
    // i = 0: up, 1: right, 2: down, 3: left
    // brain.reset() resets the brain to the current game board

	var highestScore = 0;
	var optimalDir;
	var moves = 0;
	for (var i = 0; i < 4; i++){
		var result = monteCarlo(i, gameManager, brain);
		if (result.score >= highestScore && result.moved){
			highestScore = result.score;
			optimalDir = i;
			moves = result.moves;
		}
		
		
	}
	
//	console.log('Move ' + optimalDir + ": Highest score - " + highestScore + " Moves - " + moves);
    
	//brain.move(optimalDir);
	return optimalDir;
};

function monteCarlo(direction, gameManager, brain){
	var score = 0;
	var overAllScore = 0;
//	var moves = 0;
//	var overAllMoves = 0;
	var cloneBrain = clone(brain, gameManager);
	var moved = cloneBrain.move(direction);

	
	if (moved){
		for (var i = 0; i < MAX_RUNS; i++){
//			console.log(cloneBrain.score);
//			console.log("Matches = " + tileMatchesAvailable(cloneBrain.grid));
//			console.log("Cells = " + cloneBrain.grid.cellsAvailable());
			while(tileMatchesAvailable(cloneBrain.grid) || cloneBrain.grid.cellsAvailable()){
//				if (!cloneBrain.move(randomInt(4))) continue;
//			    else score++;
				var contin = true;
				while(contin){
					if(cloneBrain.move(randomInt(4))){
						contin = false;
						score++;
					}
				}
				score += cloneBrain.score;
//				overAllMoves += moves;
//				console.log(cloneBrain.score);
			}
			overAllScore += score;
//			console.log(cloneBrain.score);
			cloneBrain = clone(brain, gameManager);
			cloneBrain.move(direction);
//			cloneBrain = clone(movedBrain, gameManager);
		}
		
	}
	return {score: overAllScore, moved: moved};
};

//Check for available matches between tiles (more expensive check)
//I copied the code from the gameManager
function tileMatchesAvailable(Grid) {
  var self = Grid;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = self.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = this.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};


Agent.prototype.evaluateGrid = function (gameManager){
    // calculate a score for the current grid configuration
};


