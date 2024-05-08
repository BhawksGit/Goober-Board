document.addEventListener("DOMContentLoaded", function() {
    const board = document.getElementById('drawingBoard');
    const modal = document.getElementById('myModal');
    const okButton = document.getElementById('okButton');
    const clearButton = document.getElementById('clearButton');
    const colorPicker = document.getElementById('colorPicker');
    const eraserButton = document.getElementById('eraserButton');
    const pencilButton = document.getElementById('pencilButton');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const submitButton = document.getElementById('submitButton');
    let selectedColor = colorPicker.value;
    let isDrawing = false;
    let currentTool = 'pencil';
    let history = [];
    let future = [];
    let currentBatch = []; // Store the current batch of changes

    // Generate pixels
    for (let i = 0; i < 256; i++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel');
        pixel.style.backgroundColor = 'transparent';
        pixel.addEventListener('mousedown', (e) => {
            isDrawing = true;
            recordState(e.target);
        });
        pixel.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                recordState(e.target);
            }
        });
        pixel.addEventListener('mouseup', () => {
            isDrawing = false;
            if (currentBatch.length > 0) {
                history.push([...currentBatch]); // Push the batch to history
                currentBatch = []; // Clear the current batch
                future = []; // Clear future on new action
            }
        });
        board.appendChild(pixel);
    }

    function applyColor(pixel) {
        if (currentTool === 'eraser') {
            pixel.style.backgroundColor = 'transparent';
        } else {
            pixel.style.backgroundColor = selectedColor;
        }
    }

    function recordState(pixel) {
        let index = Array.from(board.children).indexOf(pixel);
        if (currentBatch.find(change => change.index === index)) return; // Prevent recording the same pixel twice in one batch
        currentBatch.push({index: index, previousColor: pixel.style.backgroundColor});
        applyColor(pixel);
    }

    colorPicker.addEventListener('change', (e) => {
        selectedColor = e.target.value;
        currentTool = 'pencil';
    });

    clearButton.addEventListener('click', () => {
        let snapshot = [];
        document.querySelectorAll('.pixel').forEach((pixel, index) => {
            snapshot.push({index: index, previousColor: pixel.style.backgroundColor});
            pixel.style.backgroundColor = 'transparent';
        });
        history.push(snapshot);
        future = [];
    });

    undoButton.addEventListener('click', () => {
        if (history.length > 0) {
            const lastAction = history.pop();
            const currentStates = [];
            lastAction.forEach(change => {
                const pixel = board.children[change.index];
                currentStates.push({index: change.index, previousColor: pixel.style.backgroundColor});
                pixel.style.backgroundColor = change.previousColor;
            });
            future.push(currentStates);
        }
    });

    redoButton.addEventListener('click', () => {
        if (future.length > 0) {
            const nextAction = future.pop();
            const currentStates = [];
            nextAction.forEach(change => {
                const pixel = board.children[change.index];
                currentStates.push({index: change.index, previousColor: pixel.style.backgroundColor});
                pixel.style.backgroundColor = change.previousColor;
            });
            history.push(currentStates);
        }
    });

    submitButton.addEventListener('click', () => {
        let data = "";
        const pixels = document.querySelectorAll('.pixel');
        pixels.forEach((pixel, index) => {
            const x = index % 16; // Calculate x coordinate (column)
            const y = Math.floor(index / 16); // Calculate y coordinate (row)
            const color = pixel.style.backgroundColor;
            data += `(${x}, ${y}): ${color}\n`; // Format: (x, y): color
        });

        // Create a Blob from the data
        const blob = new Blob([data], {type: 'text/plain'});

        // Use FormData to package the file and the PIN
        const formData = new FormData();
        formData.append("fileToUpload", blob, "coordinates.txt");
        formData.append("pin", "600b3r"); // Add the secret PIN

        // Get the selected board URL from the dropdown
        const boardSelector = document.getElementById('boardSelector');
        const selectedBoardURL = 'https://ec2-3-129-210-155.us-east-2.compute.amazonaws.com/gooberaniv24/' + boardSelector.value;

        // Send the FormData object via a fetch POST request
        fetch(selectedBoardURL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            console.log(result);
            modal.style.display = "block"; // Show the modal on successful response
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });


        // Close the modal when the OK button is clicked
        okButton.addEventListener('click', () => {
        modal.style.display = "none";
        });

    eraserButton.addEventListener('click', () => currentTool = 'eraser');
    pencilButton.addEventListener('click', () => currentTool = 'pencil');
    document.addEventListener('mouseup', () => isDrawing = false);
});
