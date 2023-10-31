function imageFluid(canvasId, imageId, options) {
  const myCanvas = document.querySelector(`#${canvasId}`);
  const context = myCanvas.getContext("2d");
  const codeImg = document.querySelector(`#${imageId}`);
  codeImg.style.opacity = "0";
  myCanvas.style.opacity = "0";
  const imgWidth = codeImg.offsetWidth;
  const imgHeight = codeImg.offsetHeight;
  //   constants changable via options

  const squareOffset = options?.squareOffset || 0;
  if (myCanvas.width < imgWidth + 100 + squareOffset * imgWidth) {
    myCanvas.width = imgWidth + 100 + squareOffset * imgWidth;
  }
  if (myCanvas.height < imgHeight + 100 + squareOffset * imgHeight) {
    myCanvas.height = imgHeight + 100 + squareOffset * imgHeight;
  }
  context.lineWidth = options?.squareSize || 3;
  const squareSize = options?.squareSize || 3;
  const squareContainSize = squareSize + squareOffset;
  const Offset = options?.Offset || 50;
  const mouseCircleRadius = options?.mouseCircleRadius || 50;
  const movementRate = options?.movementRate || 4;
  const frameRate = options?.frameRate || 40;
  //

  let intervalId;
  let shoulIntervalRun = true;
  let intervalRunningStatus = true;
  const mousePos = {
    x: 5000,
    y: 5000,
  };
  context.drawImage(codeImg, 0, 0, imgWidth, imgHeight);
  const imgData = context.getImageData(0, 0, imgWidth, imgHeight);
  codeImg.style.display = "none";
  const colorArray = [];
  const pointsNormalArray = [];
  function getAverageColorValue(i, pixelWidth) {
    let divider = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    let startPoint = i;
    for (let j = 0; j < squareSize; j++) {
      if (imgData.data[startPoint] === undefined) continue;
      for (let k = startPoint; k < startPoint + pixelWidth * 4; k += 4) {
        if (imgData.data[k + 3] === 0) continue;
        red += imgData.data[k];
        green += imgData.data[k + 1];
        blue += imgData.data[k + 2];
        divider++;
      }
      startPoint += imgWidth * 4;
    }
    let colors;
    if (divider !== 0) {
      red = Math.floor(red / divider);
      green = Math.floor(green / divider);
      blue = Math.floor(blue / divider);
      colorArray.push(`rgb(${red},${green},${blue})`);
      colors = true;
    } else {
      colors = null;
    }
    return colors;
  }
  // convert image data to particle position data
  function fillPointsArray() {
    let xOff = 0;
    let yOff = 0;
    let valuesOfOneRow = imgWidth * 4;
    for (let i = 0; i < imgHeight; i += squareSize) {
      for (
        let j = i * valuesOfOneRow;
        j < (i + 1) * valuesOfOneRow - 4;
        j += squareSize * 4
      ) {
        const color = getAverageColorValue(j, squareSize);
        if (color !== null) {
          pointsNormalArray.push(
            Math.floor(Math.random() * 500),
            Math.floor(Math.random() * 500),
            xOff + Offset,
            yOff + Offset + squareSize
          );
          context.beginPath();
          context.moveTo(xOff, i + squareSize / 2);
          context.lineTo(xOff + squareSize, i + squareSize / 2);
          context.stroke();
        }
        xOff += squareContainSize;
      }
      yOff += squareContainSize;
      xOff = 0;
    }
  }
  fillPointsArray();
  const numberOfSquares = pointsNormalArray.length / 4;
  if (numberOfSquares > 20000) {
    console.warn(
      "Too many particles created. May lead to slower refresh rate. Try increasing the squareSize"
    );
  }
  const pointsUintArr = new Float32Array(pointsNormalArray);
  context.clearRect(0, 0, myCanvas.offsetWidth, myCanvas.offsetHeight);
  myCanvas.style.opacity = 1;

  // Interval
  function StartInterval() {
    intervalRunningStatus = true;
    const intervalId = setInterval(() => {
      shoulIntervalRun = false;
      drawNewPoints();
    }, 1000 / frameRate);
    return intervalId;
  }

  function closeInterval() {
    intervalRunningStatus = false;
    clearInterval(intervalId);
  }
  intervalId = StartInterval();

  //   main function
  function drawNewPoints() {
    context.clearRect(0, 0, myCanvas.width, myCanvas.height);
    let pointIndex = 0;
    for (let i = 0; i < pointsUintArr.length; i += 4) {
      const defX = pointsUintArr[i + 2];
      const defY = pointsUintArr[i + 3];
      //   find new location when colliding with mouse point
      movePointOnCollission(i, i + 1);
      //   move towards the original position
      movePointToDefaultPosition(i, i + 1, defX, defY);
      //   draw new point on new location
      context.strokeStyle = colorArray[pointIndex];
      context.beginPath();
      context.moveTo(pointsUintArr[i], pointsUintArr[i + 1]);
      context.lineTo(pointsUintArr[i] + squareSize, pointsUintArr[i + 1]);
      context.stroke();
      pointIndex++;
    }
    // close interval when there is no movement
    if (shoulIntervalRun === false) {
      closeInterval();
    }
  }
  function findDistanceBetween(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  function movePointOnCollission(x, y) {
    let x1 = pointsUintArr[x];
    let y1 = pointsUintArr[y];
    const distance = findDistanceBetween(mousePos.x, mousePos.y, x1, y1);
    const distanceToMove = ((6000 - distance) / distance) * 0.03;
    const limit = 7;
    pointsUintArr[x] =
      ((x1 - mousePos.x) *
        Math.max(
          distance + Math.min(distanceToMove, limit),
          mouseCircleRadius
        )) /
        distance +
      mousePos.x;
    pointsUintArr[y] =
      ((y1 - mousePos.y) *
        Math.max(
          distance + Math.min(distanceToMove, limit),
          mouseCircleRadius
        )) /
        distance +
      mousePos.y;
  }
  function movePointToDefaultPosition(x, y, x2, y2) {
    const x1 = pointsUintArr[x];
    const y1 = pointsUintArr[y];
    if (x1 !== x2 || y1 !== y2) {
      if (Math.abs(x1 - x2) < 0.1 && Math.abs(y1 - y2) < 0.1) {
        pointsUintArr[x] = x2;
        pointsUintArr[y] = y2;
        return;
      }
      const distance = findDistanceBetween(x1, y1, x2, y2);
      //   if point needs to move then interval should not be stopped
      shoulIntervalRun = true;
      const newLocation = moveCloser(x1, y1, x2, y2, distance);
      pointsUintArr[x] = newLocation[0];
      pointsUintArr[y] = newLocation[1];
    }
  }
  function moveCloser(x1, y1, x2, y2, distance) {
    // console.log("closer");
    const movementSpeed = (movementRate * distance) / mouseCircleRadius;
    const x3 = ((x1 - x2) * (distance - movementSpeed)) / distance + x2;
    const y3 = ((y1 - y2) * (distance - movementSpeed)) / distance + y2;
    return [x3, y3];
  }
  //   on mouse move store the mouse pointer location with respect to canvas
  document.addEventListener("mousemove", (e) => {
    if (e.target === myCanvas) {
      mousePos.x = e.offsetX;
      mousePos.y = e.offsetY;
    } else {
      mousePos.x = 5000;
      mousePos.y = 5000;
    }
  });
  //   when mouse comes in contact with canvas restart interval if closed
  myCanvas.addEventListener("mouseover", () => {
    if (intervalRunningStatus === false) {
      intervalId = StartInterval();
    }
  });
  return intervalId;
}
export default imageFluid;
