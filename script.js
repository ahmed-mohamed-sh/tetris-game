// Modern Tetris Game Logic
document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const BLOCK_SIZE = 30;
    
    // DOM elements
    const gameBoard = document.querySelector('.game-board');
    const nextPiecePreview = document.querySelector('.next-piece-preview');
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const startButton = document.getElementById('start-button');
    
    // Game variables
    let score = 0;
    let level = 1;
    let gameSpeed = 1000; // Initial speed in milliseconds
    let gameTimerId;
    let isGameOver = false;
    let isPaused = false;
    let currentPiece = null;
    let nextPiece = null;
    let grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
    
    // Tetromino shapes and colors
    const TETROMINOES = [
        {
            name: 'i-block',
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 'i-block'
        },
        {
            name: 'j-block',
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'j-block'
        },
        {
            name: 'l-block',
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'l-block'
        },
        {
            name: 'o-block',
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 'o-block'
        },
        {
            name: 's-block',
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: 's-block'
        },
        {
            name: 't-block',
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 't-block'
        },
        {
            name: 'z-block',
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: 'z-block'
        }
    ];
    
    // Initialize the game board
    function initializeBoard() {
        // Clear the game board
        gameBoard.innerHTML = '';
        
        // Create the grid cells
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                const cell = document.createElement('div');
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);
                cell.style.width = `${BLOCK_SIZE}px`;
                cell.style.height = `${BLOCK_SIZE}px`;
                gameBoard.appendChild(cell);
            }
        }
        
        // Reset the grid
        grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
    }
    
    // Initialize the next piece preview
    function initializeNextPiecePreview() {
        nextPiecePreview.innerHTML = '';
        
        // Create the preview grid cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);
                nextPiecePreview.appendChild(cell);
            }
        }
    }
    
    // Get a random tetromino
    function getRandomTetromino() {
        const randomIndex = Math.floor(Math.random() * TETROMINOES.length);
        const tetromino = TETROMINOES[randomIndex];
        
        return {
            name: tetromino.name,
            shape: JSON.parse(JSON.stringify(tetromino.shape)), // Deep copy
            color: tetromino.color,
            row: 0,
            col: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2)
        };
    }
    
    // Draw the current piece on the board
    function drawPiece() {
        if (!currentPiece) return;
        
        // Clear all tetromino cells
        const cells = gameBoard.querySelectorAll('.tetromino');
        cells.forEach(cell => {
            cell.classList.remove('tetromino', currentPiece.color);
        });
        
        // Draw the current piece
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.row + row;
                    const boardCol = currentPiece.col + col;
                    
                    if (boardRow >= 0) {
                        const cell = gameBoard.querySelector(`[data-row="${boardRow}"][data-col="${boardCol}"]`);
                        if (cell) {
                            cell.classList.add('tetromino', currentPiece.color);
                            // Add subtle animation effect
                            cell.style.animation = 'none';
                            cell.offsetHeight; // Trigger reflow
                            cell.style.animation = 'fadeIn 0.2s';
                        }
                    }
                }
            }
        }
        
        // Draw ghost piece (preview of where the piece will land)
        drawGhostPiece();
    }
    
    // Draw the ghost piece (preview of where the piece will land)
    function drawGhostPiece() {
        if (!currentPiece) return;
        
        // Clear all ghost cells
        const ghostCells = gameBoard.querySelectorAll('.ghost');
        ghostCells.forEach(cell => {
            cell.classList.remove('ghost', currentPiece.color);
        });
        
        // Create a copy of the current piece
        const ghostPiece = {
            ...currentPiece,
            shape: JSON.parse(JSON.stringify(currentPiece.shape)),
            row: currentPiece.row
        };
        
        // Move the ghost piece down until it collides
        while (!checkCollision(ghostPiece, 0, 1, ghostPiece.shape)) {
            ghostPiece.row++;
        }
        
        // Only draw the ghost if it's different from the current piece position
        if (ghostPiece.row !== currentPiece.row) {
            // Draw the ghost piece
            for (let row = 0; row < ghostPiece.shape.length; row++) {
                for (let col = 0; col < ghostPiece.shape[row].length; col++) {
                    if (ghostPiece.shape[row][col]) {
                        const boardRow = ghostPiece.row + row;
                        const boardCol = ghostPiece.col + col;
                        
                        if (boardRow >= 0) {
                            const cell = gameBoard.querySelector(`[data-row="${boardRow}"][data-col="${boardCol}"]`);
                            if (cell && !cell.classList.contains('tetromino')) {
                                cell.classList.add('ghost', currentPiece.color);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Draw the next piece in the preview
    function drawNextPiece() {
        if (!nextPiece) return;
        
        // Clear the preview
        const cells = nextPiecePreview.querySelectorAll('div');
        cells.forEach(cell => {
            cell.classList.remove('tetromino');
            cell.classList.remove(...Array.from(cell.classList).filter(c => c.endsWith('-block')));
        });
        
        // Center the piece in the preview
        const offsetRow = Math.floor((4 - nextPiece.shape.length) / 2);
        const offsetCol = Math.floor((4 - nextPiece.shape[0].length) / 2);
        
        // Draw the next piece
        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    const previewRow = offsetRow + row;
                    const previewCol = offsetCol + col;
                    const cell = nextPiecePreview.querySelector(`[data-row="${previewRow}"][data-col="${previewCol}"]`);
                    if (cell) {
                        cell.classList.add('tetromino', nextPiece.color);
                    }
                }
            }
        }
    }
    
    // Check for collision
    function checkCollision(piece, rowOffset, colOffset, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newRow = piece.row + row + rowOffset;
                    const newCol = piece.col + col + colOffset;
                    
                    // Check if out of bounds
                    if (newRow >= BOARD_HEIGHT || newCol < 0 || newCol >= BOARD_WIDTH) {
                        return true;
                    }
                    
                    // Check if already filled (and not above the board)
                    if (newRow >= 0 && grid[newRow][newCol]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // Rotate the current piece
    function rotatePiece() {
        if (!currentPiece || currentPiece.name === 'o-block') return; // O block doesn't rotate
        
        // Create a new rotated shape
        const newShape = [];
        for (let col = 0; col < currentPiece.shape[0].length; col++) {
            const newRow = [];
            for (let row = currentPiece.shape.length - 1; row >= 0; row--) {
                newRow.push(currentPiece.shape[row][col]);
            }
            newShape.push(newRow);
        }
        
        // Check if the rotation is valid
        if (!checkCollision(currentPiece, 0, 0, newShape)) {
            currentPiece.shape = newShape;
            drawPiece();
        } else {
            // Try wall kicks (standard SRS wall kick)
            const wallKicks = [
                [0, 0], // Original position
                [0, -1], // Try left
                [0, 1], // Try right
                [0, -2], // Try 2 left
                [0, 2], // Try 2 right
                [-1, 0], // Try up
                [-1, -1], // Try up-left
                [-1, 1], // Try up-right
                [1, 0], // Try down (rare case)
            ];
            
            for (const [rowKick, colKick] of wallKicks) {
                if (!checkCollision(currentPiece, rowKick, colKick, newShape)) {
                    currentPiece.shape = newShape;
                    currentPiece.row += rowKick;
                    currentPiece.col += colKick;
                    drawPiece();
                    break;
                }
            }
        }
    }
    
    // Move the current piece
    function movePiece(rowOffset, colOffset) {
        if (!currentPiece || isPaused || isGameOver) return;
        
        if (!checkCollision(currentPiece, rowOffset, colOffset, currentPiece.shape)) {
            currentPiece.row += rowOffset;
            currentPiece.col += colOffset;
            drawPiece();
            return true;
        }
        return false;
    }
    
    // Hard drop the current piece
    function hardDrop() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        while (movePiece(1, 0)) {
            // Move down until collision
            score += 2; // 2 points per cell dropped
        }
        
        lockPiece();
        updateScore();
    }
    
    // Lock the current piece in place
    function lockPiece() {
        if (!currentPiece) return;
        
        // Add the piece to the grid
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.row + row;
                    const boardCol = currentPiece.col + col;
                    
                    // Game over if piece locks above the board
                    if (boardRow < 0) {
                        gameOver();
                        return;
                    }
                    
                    grid[boardRow][boardCol] = currentPiece.color;
                }
            }
        }
        
        // Check for completed lines
        checkLines();
        
        // Get the next piece
        currentPiece = nextPiece;
        nextPiece = getRandomTetromino();
        drawPiece();
        drawNextPiece();
    }
    
    // Check for completed lines
    function checkLines() {
        let linesCleared = 0;
        
        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            if (grid[row].every(cell => cell !== 0)) {
                // Remove the line
                grid.splice(row, 1);
                // Add a new empty line at the top
                grid.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                
                // Move the check position back up since we removed a line
                row++;
            }
        }
        
        // Update the visual representation
        updateBoardDisplay();
        
        // Update score based on lines cleared
        if (linesCleared > 0) {
            // Classic Tetris scoring system
            const linePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
            score += linePoints[linesCleared] * level;
            
            // Level up every 10 lines
            const totalLines = Math.floor(score / 1000);
            if (totalLines > level - 1) {
                level = totalLines + 1;
                // Increase game speed
                gameSpeed = Math.max(100, 1000 - (level - 1) * 100);
                clearInterval(gameTimerId);
                gameTimerId = setInterval(moveDown, gameSpeed);
                
                // Update level display
                levelDisplay.textContent = level;
            }
            
            updateScore();
        }
    }
    
    // Update the visual representation of the board
    function updateBoardDisplay() {
        const cells = gameBoard.querySelectorAll('div');
        
        cells.forEach(cell => {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            
            // Remove all block classes
            cell.classList.remove('tetromino');
            cell.classList.remove(...Array.from(cell.classList).filter(c => c.endsWith('-block')));
            
            // Add the appropriate class if the cell is filled
            if (grid[row][col]) {
                cell.classList.add('tetromino', grid[row][col]);
            }
        });
    }
    
    // Update the score display
    function updateScore() {
        scoreDisplay.textContent = score;
    }
    
    // Move the current piece down
    function moveDown() {
        if (isPaused || isGameOver) return;
        
        if (!movePiece(1, 0)) {
            lockPiece();
        }
    }
    
    // Game over
    function gameOver() {
        isGameOver = true;
        clearInterval(gameTimerId);
        
        // Create game over overlay
        const gameOverDiv = document.createElement('div');
        gameOverDiv.classList.add('game-over');
        
        const gameOverTitle = document.createElement('h2');
        gameOverTitle.textContent = 'Game Over';
        
        const finalScore = document.createElement('p');
        finalScore.textContent = `Final Score: ${score}`;
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.addEventListener('click', startGame);
        
        gameOverDiv.appendChild(gameOverTitle);
        gameOverDiv.appendChild(finalScore);
        gameOverDiv.appendChild(restartButton);
        
        gameBoard.appendChild(gameOverDiv);
        gameOverDiv.style.display = 'flex';
    }
    
    // Start the game
    function startGame() {
        // Reset game state
        score = 0;
        level = 1;
        gameSpeed = 1000;
        isGameOver = false;
        isPaused = false;
        
        // Clear any existing game over overlay
        const gameOverDiv = gameBoard.querySelector('.game-over');
        if (gameOverDiv) {
            gameOverDiv.remove();
        }
        
        // Initialize the board
        initializeBoard();
        initializeNextPiecePreview();
        
        // Update displays
        updateScore();
        levelDisplay.textContent = level;
        
        // Get the first pieces
        currentPiece = getRandomTetromino();
        nextPiece = getRandomTetromino();
        
        // Draw the pieces
        drawPiece();
        drawNextPiece();
        
        // Start the game loop
        clearInterval(gameTimerId);
        gameTimerId = setInterval(moveDown, gameSpeed);
        
        // Change button text
        startButton.textContent = 'Restart Game';
    }
    
    // Pause/resume the game
    function togglePause() {
        if (isGameOver) return;
        
        isPaused = !isPaused;
        
        if (isPaused) {
            clearInterval(gameTimerId);
        } else {
            gameTimerId = setInterval(moveDown, gameSpeed);
        }
    }
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    
    document.addEventListener('keydown', event => {
        if (isGameOver) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                movePiece(0, -1);
                break;
            case 'ArrowRight':
                movePiece(0, 1);
                break;
            case 'ArrowDown':
                if (movePiece(1, 0)) {
                    score += 1; // 1 point for soft drop
                    updateScore();
                }
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ': // Space bar
                hardDrop();
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
        }
    });
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    gameBoard.addEventListener('touchstart', event => {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    });
    
    gameBoard.addEventListener('touchend', event => {
        touchEndX = event.changedTouches[0].screenX;
        touchEndY = event.changedTouches[0].screenY;
        handleTouch();
    });
    
    function handleTouch() {
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const threshold = 30; // Minimum swipe distance
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    // Swipe right
                    movePiece(0, 1);
                } else {
                    // Swipe left
                    movePiece(0, -1);
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(diffY) > threshold) {
                if (diffY > 0) {
                    // Swipe down
                    hardDrop();
                } else {
                    // Swipe up
                    rotatePiece();
                }
            } else {
                // Tap (short touch)
                rotatePiece();
            }
        }
    }
    
    // Initialize the game
    initializeBoard();
    initializeNextPiecePreview();
});