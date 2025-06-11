import { Area } from 'react-easy-crop';

/**
 * Cria um elemento de imagem a partir de uma URL.
 * @param {string} url - A URL da imagem.
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Necessário para evitar erros de CORS
    image.src = url;
  });

/**
 * Corta uma imagem com base nos pixels da área selecionada.
 * @param {string} imageSrc - A URL da imagem original (dataURL).
 * @param {Area} pixelCrop - O objeto com as dimensões e posição do corte em pixels.
 * @returns {Promise<Blob | null>} - A imagem cortada como um Blob.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Define o tamanho do canvas para ser o tamanho do corte
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Desenha a imagem original no canvas, mas apenas a parte selecionada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Converte o conteúdo do canvas para um Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg'); // Você pode usar 'image/png' se preferir
  });
}