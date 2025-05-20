export default function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Преобразование в круглую маску
      const circleCanvas = document.createElement("canvas");
      const circleCtx = circleCanvas.getContext("2d");
      const size = Math.min(canvas.width, canvas.height);

      circleCanvas.width = size;
      circleCanvas.height = size;

      // Маска круга
      circleCtx.beginPath();
      circleCtx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      circleCtx.closePath();
      circleCtx.clip();

      // Вставка обрезанного изображения в круг
      circleCtx.drawImage(
        canvas,
        (canvas.width - size) / 2,
        (canvas.height - size) / 2,
        size,
        size,
        0,
        0,
        size,
        size
      );

      const base64Image = circleCanvas.toDataURL("image/png");
      resolve(base64Image);
    };

    image.onerror = (error) => {
      reject("Ошибка загрузки изображения: " + error);
    };
  });
}