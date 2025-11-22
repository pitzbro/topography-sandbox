const canvas = document.querySelector('canvas');

export default function userInteractions() {
    const { width, height, x, y } = canvas.getBoundingClientRect();
    canvas.onmousemove = (ev) => {
        const { clientX, clientY } = ev

        const precX = clientX / (width + x) * 100;
        const precY = clientY / (height + y) * 100;
        console.log('precX', precX, 'precY', precY,)
    }
}