(window => {
  const MAX_N = 20;
  const EPSILON = 10;
  const frameRate = 1000 / 5;
  const colors = {
    darkBlue: '#007399',
    lightBlue: '#80dfff'
  };

  const random = Math.random.bind(Math);
  const floor = Math.floor.bind(Math);

  const sum = row => (row.length ? row.reduce((acc, v) => acc + v, 0) : 0);
  const randomN = (N = 0) => Math.round(random() * N);
  const multiplyBy = a => b => a * b;
  const square = (a = 0) => a * a;
  const calculateDistance = (c1, c2) =>
    Math.sqrt(square(c1.x - c2.x) + square(c1.y - c2.y));
  const createRandomPoint = size => ({
    x: floor(random() * size),
    y: floor(random() * size)
  });
  const createRandomCirclesCenters = (n = 0, size = 0) =>
    [...Array(n).keys()].map(() => createRandomPoint(size));
  const setCirclesRadius = (circlesCenters, r) =>
    circlesCenters.map(circleCenter => ({ ...circleCenter, r }));
  const toCircleCenter = ({ x, y }) => ({ x, y });
  const toCircleCenters = circles => circles.map(toCircleCenter);
  const removeChildren = node => {
    while (node.firstChild) {
      node.firstChild.remove();
    }
  };
  const generateRandomRestrictedPoint = (
    x,
    epsilon,
    size,
    lowerBound = 0,
    upperBound = size
  ) => {
    const lowerXBound = Math.max(lowerBound, x - epsilon);
    const upperXBound = Math.min(x + epsilon, upperBound);

    return lowerXBound + Math.floor(random() * (upperXBound - lowerXBound));
  };

  const createTriangleCirclesCenters = (N, size) => {
    const sqrtN = Math.floor(Math.sqrt(N));
    const isSquare = sqrtN === Math.sqrt(N);

    const oddRowSize = sqrtN;
    const evenRowSize = isSquare ? oddRowSize : oddRowSize - 1;
    const rowSizes = [];

    let l = 0;
    let i = 0;

    while (l !== N) {
      const possibleSize = i++ % 2 === 0 ? oddRowSize : evenRowSize;
      let size = 0;

      if (possibleSize > N - l) {
        size = N - l;
      } else {
        size = possibleSize;
      }

      rowSizes.push(size);
      l += size;
    }

    const rowsCount = rowSizes.length;

    const h = size / rowsCount;
    const wOdd = size / (oddRowSize + 1);
    const wEven = size / (evenRowSize + 1);
    const isEven = rowsCount % 2 === 0;
    let usedRows = 0;

    const circleCenters = [];
    const initialEpsilon = Math.round(size / square(N));

    const calculateValue = (i, p) => {
      return generateRandomRestrictedPoint(i * p + p / 2, initialEpsilon, size);
    };

    while (usedRows < rowsCount) {
      if (rowsCount - usedRows === 1) {
        const rowSize = rowSizes[usedRows];
        for (let i = 0; i < rowSize; i += 1) {
          const cc = {
            y: calculateValue(usedRows, h),
            x: calculateValue(i + i % 2, wOdd)
          };
          circleCenters.push(cc);
        }
        usedRows += 1;
      } else {
        const twoRowsSize = rowSizes[usedRows] + rowSizes[usedRows + 1];

        for (let i = 0; i < twoRowsSize; i += 1) {
          const imod2 = i % 2;
          const cc = {
            y: calculateValue(usedRows + imod2, h),
            x: calculateValue(
              Math.floor(i / 2) + imod2,
              imod2 === 0 ? wEven : wOdd
            )
          };
          circleCenters.push(cc);
        }
        usedRows += 2;
      }
    }

    return circleCenters;
  };

  const objectiveFunction = r => 1 / r;

  const createCircles = (n, size) => {
    // const circlesCenters = createRandomCirclesCenters(n, size);
    const circlesCenters = createTriangleCirclesCenters(n, size);
    const distancesMatrix = calculateDistancesMatrix(circlesCenters);
    const r = findMinRadius(distancesMatrix, circlesCenters, size);

    return [setCirclesRadius(circlesCenters, r), r];
  };

  const calculateDistancesMatrix = circles => {
    const m = [];

    circles.forEach((firstCircle, i) => {
      m[i] = [];
      circles.forEach((secondCircle, j) => {
        m[i][j] = calculateDistance(firstCircle, secondCircle);
      });
    });

    return m;
  };

  const findMinRadius = (distancesMatrix, circles, size) => {
    const N = distancesMatrix.length;
    let minDistance = Infinity;

    for (let i = 0; i < N - 1; i += 1) {
      for (let j = i + 1; j < N; j += 1) {
        const distance = distancesMatrix[i][j];

        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }

    for (let i = 0; i < N; i += 1) {
      const { x, y } = circles[i];
      const values = [x, y, Math.min(size - x, size), Math.min(size - y, size)];
      const minBound = Math.min.apply(null, values) * 2;

      if (minBound < minDistance) {
        minDistance = minBound;
      }
    }

    return minDistance / 2;
  };

  const circleRandomUpdate = (circle, size) => createRandomPoint(size);

  const circleLocalCenterUpdate = ({ x, y }, size, epsilon) => ({
    x: generateRandomRestrictedPoint(x, epsilon, size),
    y: generateRandomRestrictedPoint(y, epsilon, size)
  });

  const insertNewCircles = (newCircles, indexes, circles) => {
    const updatedCircles = circles.map(_ => _);

    indexes.forEach((index, i) => {
      updatedCircles[index] = newCircles[i];
    });

    return updatedCircles;
  };

  const recalculateNRandomCircleCenters = (
    circles,
    size,
    epsilon,
    t,
    updatableCirclesCount
  ) => {
    const randomIndexes = [];
    const N = circles.length;
    let c = 0;

    while (c < updatableCirclesCount) {
      const i = randomN(N - 1);
      if (randomIndexes.indexOf(i) === -1) {
        randomIndexes[c] = i;
        c += 1;
      }
    }
    const i = randomN(circles.length - 1);

    const newCircleCenters = randomIndexes.map(i =>
      circleLocalCenterUpdate(circles[i], size, epsilon)
    );

    const updatedCirclesCenters = toCircleCenters(
      insertNewCircles(newCircleCenters, randomIndexes, circles)
    );

    const newDistancesMatrix = calculateDistancesMatrix(updatedCirclesCenters);
    const r = findMinRadius(newDistancesMatrix, updatedCirclesCenters, size);

    return [setCirclesRadius(updatedCirclesCenters, r), r];
  };

  const initDrawing = (ctx, { width = 0, height = 0 }) => circles => {
    ctx.fillStyle = colors.darkBlue;
    ctx.fillRect(0, 0, width, height);

    if (!circles) {
      return;
    }
    const N = circles.length;
    ctx.font = `${N / (N - 1)}em Arial`;
    ctx.strokeStyle = colors.lightBlue;
    ctx.fillStyle = colors.lightBlue;
    circles.forEach(({ x, y, r }, circleIndex) => {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillText(circleIndex, x - 5, y + 5);
    });
  };

  const fillNewRow = (table, data) => {
    const row = table.insertRow(0);
    data.forEach(value => {
      row.insertCell(-1).textContent = value;
    });
  };

  const initHistory = () => ({
    list: [],
    remember(state) {
      return this.list.push(state);
    },
    reset() {
      this.list = [];
    },
    get last() {
      return this.list[this.list.length - 1];
    }
  });

  const createState = (circles, r) => ({
    circles,
    r,
    objective: objectiveFunction(r)
  });

  const setupCanvas = canvas => {
    const ratio = 2;
    const { width: oldWidth, height: oldHeight } = canvas;
    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = `${oldWidth}px`;
    canvas.style.height = `${oldHeight}px`;
  };

  const initIterationsCounter = holder => iterationsCount =>
    (holder.textContent = iterationsCount);

  const initTableUpdater = table => data => {
    if (data === null) {
      removeChildren(table);
      return;
    }

    fillNewRow(table, data);
  };

  window.onload = () => {
    const canvas = document.getElementById('canvas');

    setupCanvas(canvas);
    const { width, height } = canvas;
    const circlesCountInput = document.getElementById('circlesCount');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const updateButton = document.getElementById('updateButton');
    const historyTable = document.getElementById('history');
    const epsilonInput = document.getElementById('epsilon');
    const iterationsCountHolder = document.getElementById('iterationsCount');
    const timeHolder = document.getElementById('time');
    const ctx = canvas.getContext('2d');
    const draw = initDrawing(ctx, { width, height });
    const history = initHistory();
    const updateIterationsCount = initIterationsCounter(iterationsCountHolder);
    const updateIterationsTable = initTableUpdater(historyTable);

    let iterationsCount = 0;
    let startTime = new Date();
    let epsilon = EPSILON;
    let N = MAX_N;
    let updatableCirclesCount = MAX_N;
    let isStopped = true;
    let circles = null;
    let timer = 0;

    iterationsCountHolder.textContent = '0';

    const reset = () => {
      iterationsCount = 0;

      updateIterationsTable(null);
      updateIterationsCount(0);
      history.reset();
    };

    const update = () => {
      if (!circles) {
        return;
      }
      const [newCircles, minR] = recalculateNRandomCircleCenters(
        circles,
        width,
        epsilon,
        iterationsCount % N,
        updatableCirclesCount
      );
      const scaledR = minR / width;
      const newObjective = 1 / scaledR;
      const { objective: oldObjective } = history.last;

      updateIterationsCount(++iterationsCount);

      if (newObjective <= oldObjective) {
        const step = history.remember(createState(circles, minR / width), N);
        circles = newCircles;

        const filledSquare = N * (Math.PI * square(scaledR));

        updateIterationsTable([
          step - 1,
          iterationsCount,
          scaledR.toFixed(4),
          newObjective.toFixed(4),
          `${filledSquare.toFixed(6)}`
        ]);
      }
    };

    startButton.onclick = () => {
      if (!isStopped) {
        return;
      }

      reset();

      N =
        Number(circlesCountInput.value) ||
        Math.max(Math.ceil(Math.random() * MAX_N), 2);
      epsilon = Number(epsilonInput.value) || EPSILON;
      updatableCirclesCount = Math.round(
        // N <= 100 ? Math.sqrt(N) : Math.pow(N, 1 / 3)
        N / 5
      ) || 1;
      startTime = Date.now();
      const [newCircles, minR] = createCircles(N, width);

      isStopped = false;
      circles = newCircles;
      circlesCountInput.value = N;
      iterationsCountHolder.textContent = '0';
      timeHolder.textContent = '0s';
      epsilonInput.value = epsilon;
      iterationsCount = 0;

      history.remember(createState(circles, minR / width), N);

      draw(newCircles);

      const step = () => {
        update();
        draw(circles);
        if (!isStopped) {
          requestAnimationFrame(step);
        }
      };

      const updateTime = () => {
        timeHolder.textContent = `${Math.floor(
          (Date.now() - startTime) / 1000
        )}s`;

        if (!isStopped) {
          timer = setTimeout(updateTime, 1000);
        }
      };

      requestAnimationFrame(step);
      timer = setTimeout(updateTime, 1000);
    };

    stopButton.onclick = () => {
      isStopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };

    updateButton.onclick = () => {
      update();
      draw(circles);
    };

    draw();
  };
})(window);
