const IMAGE_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/333852/shibuya-crossing-923000_640.jpg'

const imageElement = document.getElementById('glitch-background')
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const base64Map = base64Chars.split( '' )
const reversedBase64Map = {}

base64Map.forEach((value, key) => reversedBase64Map[value] = key)

// messes with base64 image data and returns the glitched data
function getGlitchedImageData (base64ImageData, { seed, amount, iterations }) {
	const byteArrayImageData = base64ToByteArray(base64ImageData)
	const jpgHeaderLength = getJpegHeaderSize(byteArrayImageData)
	
	for (let i = 0, len = iterations; i < len; i++)
		glitchJpegBytes(byteArrayImageData, jpgHeaderLength, seed, amount, i, iterations)
	
	return byteArrayToBase64(byteArrayImageData)
}

function glitchJpegBytes (byteArray, jpgHeaderLength, seed, amount, i, len) {
	const maxIndex = byteArray.length - jpgHeaderLength - 4
	const pxMin = parseInt(maxIndex / len * i, 10)
	const pxMax = parseInt(maxIndex / len * (i + 1), 10)
	const delta = pxMax - pxMin

	let pxIndex = parseInt(pxMin + delta * seed, 10)

	if (pxIndex > maxIndex) pxIndex = maxIndex

	byteArray[Math.floor(jpgHeaderLength + pxIndex)] = Math.floor(amount * 256)
}

function base64ToByteArray (str) {
	const result = []

	let prev

	for (let i = 23; i < str.length; i++) {
		const cur = reversedBase64Map[str.charAt(i)]
		const digitNum = (i - 23) % 4
		
		switch (digitNum) {
			case 1:
				result.push(prev << 2 | cur >> 4)
				break
			case 2:
				result.push((prev & 15) << 4 | cur >> 2)
				break
			case 3:
				result.push((prev & 3) << 6 | cur)
				break
		}
 
		prev = cur
	}

	return result
}

function byteArrayToBase64 (arr) {
	const result = ['data:image/jpeg;base64,']

  let byteNum
	let prev
	
	for (let i = 0; i < arr.length; i++) {
		const cur = arr[i]
		
    byteNum = i % 3
		
		switch (byteNum) {
      case 0:
				result.push(base64Map[cur >> 2])
				break
			case 1:
				result.push(base64Map[(prev & 3) << 4 | cur >> 4])
				break
			case 2:
				result.push(base64Map[(prev & 15) << 2 | cur >> 6])
				result.push(base64Map[cur & 63])
				break
		}
 
		prev = cur
	}

	if (byteNum === 0) {
		result.push( base64Map[(prev & 3) << 4])
		result.push('==')
	} else if (byteNum === 1) {
		result.push(base64Map[(prev & 15) << 2] )
		result.push('=')
	}

	return result.join( '' )
}

function getJpegHeaderSize (data) {
	let result = 417

	for (let i = 0; i < data.length; i++) {
		if (data[i] === 255 && data[i + 1] === 218) {
			result = i + 2
			break
		}
	}

	return result
}

// [NOTE]: the amount is mutated in this function, hence no destructuring
function glitch (data, options) {
  options.amount = options.amount < 90 ? options.amount + 1 : 0

  imageElement.style.backgroundImage = `url(${getGlitchedImageData(data, {
    seed: options.seed,
    amount: options.amount / 100,
    iterations: options.iterations
  })})`
}

fetch(IMAGE_URL).then(response => response.blob().then(data => {
  const fr = new FileReader()
  const options = {
    seed: (Math.floor(Math.random() * 99) + 1) / 100,
    amount: Math.floor(Math.random() * 99) + 1,
    iterations: Math.floor(Math.random() * 42) + 5
  }
  
  // [NOTE]: runs on main thread because I wanted to fit it in a single pen
  fr.onload = () => window.setInterval(() => glitch(fr.result, options), 200)
  fr.readAsDataURL(data)
}))