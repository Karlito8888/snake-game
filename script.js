window.onload = () => {
  const DIRECTIONS = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, SPACE: 32 };
  const DIRECTION_MAP = {
    [DIRECTIONS.LEFT]: "left",
    [DIRECTIONS.UP]: "up",
    [DIRECTIONS.RIGHT]: "right",
    [DIRECTIONS.DOWN]: "down",
  };

  const setDirection = (newDirection) => {
    if (!myGame.isCountdownInProgress) {
      myGame.snakee.setDirection(newDirection);
    }
  };

  const chevrons = [
    document.getElementById("up-left"),
    document.getElementById("right-left"),
    document.getElementById("left-left"),
    document.getElementById("down-left"),
    document.getElementById("up-right"),
    document.getElementById("right-right"),
    document.getElementById("left-right"),
    document.getElementById("down-right"),
  ];

  chevrons.forEach((chevron) => {
    chevron.addEventListener("click", () => {
      const direction = chevron.id.split("-")[0]; // Obtient la direction à partir de l'ID
      setDirection(direction);
    });
  });

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  class Game {
    constructor() {
      this.initCanvas();
      this.init();
      this.isCountdownInProgress = false;
      this.isGameOver = false;
      this.startCountdown();
      this.canvas.addEventListener("click", this.handleRestartClick.bind(this));
      this.canvas.addEventListener(
        "mousemove",
        this.handleMouseMove.bind(this)
      );
    }

    initCanvas() {
      this.canvas = document.createElement("canvas");
      this.canvas.style.border = "5px solid rgba(128, 128, 128, 0.7)";
      this.canvas.style.display = "block";
      this.canvas.style.borderRadius = "10px";
      this.canvas.style.webkitBackdropFilter = "blur(3px)";
      this.canvas.style.backdropFilter = "blur(3px)";
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      window.addEventListener("resize", this.adjustCanvasSize.bind(this));
      this.adjustCanvasSize();
    }

    adjustCanvasSize() {
      const minSize = 290; // Taille minimale du canvas
      const preferredSize =
        Math.min(window.innerWidth, window.innerHeight) * 0.5; // Taille préférée du canvas
      const maxSize = 700; // 90% de la dimension la plus petite de la fenêtre

      const size = Math.max(minSize, Math.min(preferredSize, maxSize));
      this.canvas.width = size;
      this.canvas.height = size;
      const desiredBlocks = 23;
      this.blockSize = Math.floor(size / desiredBlocks);
      this.widthInBlocks = this.canvas.width / this.blockSize;
      this.heightInBlocks = this.canvas.height / this.blockSize;
      this.centreX = this.canvas.width / 2;
      this.centreY = this.canvas.height / 2;
    }

    init() {
      this.delay = 250;
    }

    startCountdown() {
      if (this.isCountdownInProgress) return;
      this.isCountdownInProgress = true;
      let countdownValue = 3;
      const countdownInterval = 1000;

      const drawCountdown = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = "bold 6rem sans-serif";
        this.ctx.fillStyle = "#555";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
          countdownValue.toString(),
          this.centreX,
          this.centreY
        );

        if (countdownValue > 0) {
          setTimeout(() => {
            countdownValue--;
            requestAnimationFrame(drawCountdown);
          }, countdownInterval);
        } else {
          this.isCountdownInProgress = false;
          this.launch();
        }
      };
      requestAnimationFrame(drawCountdown);
    }

    createRestartButton() {
      if (!this.isGameOver) return;

      const buttonWidth = 200;
      const buttonHeight = 50;
      const buttonX = this.centreX - buttonWidth / 2;
      const buttonY = 5;

      this.ctx.fillStyle = "#555";
      // this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      drawRoundedRect(
        this.ctx,
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        25
      );

      this.ctx.font = "bold 1.5rem sans-serif";
      this.ctx.fillStyle = "#eee";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      const buttonText = "PLAY AGAIN !";
      const buttonTextX = buttonX + buttonWidth / 2;
      const buttonTextY = buttonY + buttonHeight / 2;

      this.ctx.fillText(buttonText, buttonTextX, buttonTextY);
    }

    refreshCanvas() {
      this.snakee.advance();
      if (this.snakee.checkCollision(this.widthInBlocks, this.heightInBlocks)) {
        this.isGameOver = true;
        Drawing.gameOver(this.ctx, this.centreX, this.centreY);
        this.createRestartButton();
      } else {
        if (this.snakee.isEatingApple(this.applee)) {
          this.score++; // Incrémenter le score
          this.snakee.ateApple = true; // Marquer que le serpent a mangé la pomme

          // Placer une nouvelle pomme
          do {
            this.applee.setNewPosition(this.widthInBlocks, this.heightInBlocks);
          } while (this.applee.isOnSnake(this.snakee));

          // Accélérer le jeu à chaque fois que le serpent mange 5 pommes
          if (this.score % 5 === 0) {
            this.speedUp();
          }
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.drawGrid();
        Drawing.drawScore(this.ctx, this.centreX, this.centreY, this.score);
        Drawing.drawSnake(this.ctx, this.blockSize, this.snakee);
        Drawing.drawApple(this.ctx, this.blockSize, this.applee);
        this.timeOut = setTimeout(this.refreshCanvas.bind(this), this.delay);
      }
    }

    handleRestartClick(event) {
      if (!this.isGameOver) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const canvasX = (event.clientX - rect.left) * scaleX;
      const canvasY = (event.clientY - rect.top) * scaleY;

      const buttonWidth = 200;
      const buttonHeight = 50;
      const buttonX = this.centreX - buttonWidth / 2;
      const buttonY = 5;

      if (
        canvasX >= buttonX &&
        canvasX <= buttonX + buttonWidth &&
        canvasY >= buttonY &&
        canvasY <= buttonY + buttonHeight
      ) {
        this.isGameOver = false;
        this.startCountdown();
      }
    }

    handleMouseMove(event) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const canvasX = (event.clientX - rect.left) * scaleX;
      const canvasY = (event.clientY - rect.top) * scaleY;

      const buttonWidth = 200;
      const buttonHeight = 50;
      const buttonX = this.centreX - buttonWidth / 2;
      const buttonY = 0; // Top du canvas

      // Vérifier si la souris est sur le bouton
      if (
        canvasX >= buttonX &&
        canvasX <= buttonX + buttonWidth &&
        canvasY >= buttonY &&
        canvasY <= buttonY + buttonHeight &&
        this.isGameOver
      ) {
        this.canvas.style.cursor = "pointer";
      } else {
        this.canvas.style.cursor = "default";
      }
    }

    launch() {
      this.snakee = new Snake("right", [6, 4], [5, 4], [4, 4], [3, 4], [2, 4]);
      this.applee = new Apple([10, 10]);
      this.score = 0;
      this.delay = 250;
      clearTimeout(this.timeOut);
      this.refreshCanvas();
    }

    speedUp() {
      this.delay /= 1.5;
    }

    // drawGrid() {
    //   this.ctx.strokeStyle = "#ccc"; // Couleur de la grille, à ajuster selon le thème
    //   this.ctx.lineWidth = 1; // Épaisseur des lignes de la grille

    //   // Dessiner les lignes verticales
    //   for (let x = 0; x <= this.widthInBlocks; x++) {
    //     this.ctx.beginPath();
    //     this.ctx.moveTo(x * this.blockSize, 0);
    //     this.ctx.lineTo(x * this.blockSize, this.canvas.height);
    //     this.ctx.stroke();
    //   }

    //   // Dessiner les lignes horizontales
    //   for (let y = 0; y <= this.heightInBlocks; y++) {
    //     this.ctx.beginPath();
    //     this.ctx.moveTo(0, y * this.blockSize);
    //     this.ctx.lineTo(this.canvas.width, y * this.blockSize);
    //     this.ctx.stroke();
    //   }
    // }
  }

  class Snake {
    constructor(direction, ...body) {
      this.body = body;
      this.direction = direction;
      this.ateApple = false;
    }

    advance() {
      const nextPosition = this.body[0].slice();
      switch (this.direction) {
        case "left":
          nextPosition[0] -= 1;
          break;
        case "right":
          nextPosition[0] += 1;
          break;
        case "down":
          nextPosition[1] += 1;
          break;
        case "up":
          nextPosition[1] -= 1;
          break;
        default:
          throw "invalid direction";
      }
      this.body.unshift(nextPosition);
      if (!this.ateApple) this.body.pop();
      else this.ateApple = false;
    }

    setDirection(newDirection) {
      let allowedDirections;
      switch (this.direction) {
        case "left":
        case "right":
          allowedDirections = ["up", "down"];
          break;
        case "down":
        case "up":
          allowedDirections = ["left", "right"];
          break;
        default:
          throw "invalid direction";
      }
      if (allowedDirections.includes(newDirection)) {
        this.direction = newDirection;
      }
    }

    checkCollision(widthInBlocks, heightInBlocks) {
      const [head, ...rest] = this.body;
      const [snakeX, snakeY] = head;
      const minX = 0;
      const minY = 0;
      const maxX = widthInBlocks - 1;
      const maxY = heightInBlocks - 1;
      const isNotBetweenHorizontalWalls = snakeX < minX || snakeX > maxX;
      const isNotBetweenVerticalWalls = snakeY < minY || snakeY > maxY;

      return (
        isNotBetweenHorizontalWalls ||
        isNotBetweenVerticalWalls ||
        rest.some((block) => snakeX === block[0] && snakeY === block[1])
      );
    }

    isEatingApple(appleToEat) {
      const head = this.body[0];
      return (
        head[0] === appleToEat.position[0] && head[1] === appleToEat.position[1]
      );
    }
  }

  class Apple {
    constructor(position = [10, 10]) {
      this.position = position;
    }

    setNewPosition(widthInBlocks, heightInBlocks) {
      const newX = Math.round(Math.random() * (widthInBlocks - 1));
      const newY = Math.round(Math.random() * (heightInBlocks - 1));
      this.position = [newX, newY];
    }

    isOnSnake(snakeToCheck) {
      return snakeToCheck.body.some(
        (block) =>
          this.position[0] === block[0] && this.position[1] === block[1]
      );
    }
  }

  class Drawing {
    static gameOver(ctx, centreX, centreY) {
      ctx.save();
      ctx.font = "bold 2.7rem sans-serif";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 5;
      ctx.strokeText("GAME OVER", centreX, centreY + 120);
      ctx.fillText("GAME OVER", centreX, centreY + 120);
      ctx.restore();
    }

    static drawScore(ctx, centreX, centreY, score) {
      ctx.save();
      ctx.font = "bold 100px sans-serif";
      ctx.fillStyle = "gray";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(score.toString(), centreX, centreY);
      ctx.restore();
    }

    static drawSnake(ctx, blockSize, snake) {
      ctx.save();

      const head = snake.body[0];
      ctx.fillStyle = "#800080";
      ctx.beginPath();
      ctx.arc(
        head[0] * blockSize + blockSize / 2,
        head[1] * blockSize + blockSize / 2,
        blockSize / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Dessiner le corps du serpent
      for (let i = 1; i < snake.body.length; i++) {
        const block = snake.body[i];
        const x = block[0] * blockSize;
        const y = block[1] * blockSize;
        const radius = blockSize / 4;
        ctx.fillStyle = "#ff0000"; // Couleur rouge pour le corps
        ctx.beginPath();
        ctx.arc(x + blockSize / 2, y + blockSize / 2, radius, 0, 2 * Math.PI);
        ctx.fill();
        if (i > 0) {
          const prevBlock = snake.body[i - 1];
          const prevX = prevBlock[0] * blockSize;
          const prevY = prevBlock[1] * blockSize;

          if (prevX === x) {
            // Vertical
            ctx.fillRect(
              x + blockSize / 4,
              Math.min(y, prevY) + blockSize / 4,
              blockSize / 2,
              blockSize + blockSize / 2
            );
          } else if (prevY === y) {
            // Horizontal
            ctx.fillRect(
              Math.min(x, prevX) + blockSize / 4,
              y + blockSize / 4,
              blockSize + blockSize / 2,
              blockSize / 2
            );
          }
        }
      }

      ctx.restore();
    }

    static drawApple(ctx, blockSize, apple) {
      const radius = blockSize / 2;
      const x = apple.position[0] * blockSize + radius;
      const y = apple.position[1] * blockSize + radius;
      ctx.save();
      ctx.fillStyle = "#33cc33";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();
    }

    static drawBlock(ctx, position, blockSize) {
      const [x, y] = position;
      ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    }
  }

  const myGame = new Game();

  document.addEventListener("keydown", (e) => {
    if (e.keyCode in DIRECTION_MAP) {
      const newDirection = DIRECTION_MAP[e.keyCode];
      setDirection(newDirection);
    } else if (e.keyCode === DIRECTIONS.SPACE) {
      if (!myGame.isCountdownInProgress) {
        myGame.startCountdown();
      }
    }
  });
};
