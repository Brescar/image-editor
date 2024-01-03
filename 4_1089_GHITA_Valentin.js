class ImageEditor {
    /**
     * @type {HTMLCanvasElement}
     */
    #canvasVisibleContent;

    /**
     * @type {CanvasRenderingContext2D}
     */
    #canvasVisibleContentContext;

    /**
     * @type {HTMLCanvasElement}
     */
    #canvasOffScreen;

    /**
     * @type {CanvasRenderingContext2D}
     */
    #canvasOffScreenContext;

    /**
     * @type {string}
     */
    #effect;

    /**
     * @type {object}
     */
    #selectRegion;

    /**
     * @type {HTMLCanvasElement}
     */
    #canvasSelectRegion;

    /**
     * @type {CanvasRenderingContext2D}
     */
    #canvasSelectRegionContext;

    /**
     * @type {Array[object]}
     */
    #marginsSelection;

    /**
     * @type {object}
     */
    #mouseCoordinates;

    /**
     * @type {boolean}
     */
    #isDragging = false;

    /**
     * Returns a new ImageEditor object
     * @param {HTMLCanvasElement} canvasVisibleContent 
     * 
     * @returns {ImageEditor}
     */
    constructor(canvasVisibleContent) {
        this.#canvasVisibleContent = canvasVisibleContent;
        this.#canvasVisibleContentContext = canvasVisibleContent.getContext("2d");
        
        this.#canvasOffScreen = document.createElement("canvas");
        this.#canvasOffScreenContext = this.#canvasVisibleContent.getContext("2d");

        this.#canvasSelectRegion = document.createElement("canvas");
        this.#canvasSelectRegion.id = "canvasSelectRegion";
        document.body.appendChild(this.#canvasSelectRegion);
        this.#canvasSelectRegionContext = this.#canvasSelectRegion.getContext("2d");
    }

    /**
     * Changes the current image
     * @param {HTMLImageElement} image 
     * 
     * @returns {void}
     */
    changeImage(image) {
        this.#canvasVisibleContent.width = image.naturalWidth;
        this.#canvasVisibleContent.height = image.naturalHeight;

        this.#canvasOffScreen.width = image.naturalWidth;
        this.#canvasOffScreen.height = image.naturalHeight;

        this.#canvasSelectRegion.width = image.naturalWidth;
        this.#canvasSelectRegion.height = image.naturalHeight;

        this.#canvasOffScreenContext.drawImage(image, 0, 0);

        this.#effect = "normal";
        this.#drawImage();
    }

    /**
     * Changes the current effect.
     * @param {string} effect
     * 
     * @returns {void}
     */
    changeEffect(effect) {
        if (effect === null) 
            return;
        if (effect === this.#effect)
            return;
        
        this.#effect = effect;
        this.#drawImage();
    }

    /**
     * Draws given image with current effect on canvasVisibleContent
     * 
     * @returns {void}
     */
    #drawImage() {
        switch (this.#effect) {
            case 'normal':
                this.#normal();
                break;
            case 'select':
                this.#select();
                break;
            case 'deselect':
                this.#deselect();
                break;
            default:
                console.error("Effect not found");
                break;
        }
    }

    /**
     * Draws given image with no filters applied on canvasVisibleContent
     * 
     * @returns {void}
     */
    #normal() {
        this.#canvasVisibleContentContext.drawImage(this.#canvasOffScreen, 0, 0);
    }

    /**
     * Selects a rectangle portion of the image. Initially set on the whole image. Can be adjusted
     * at corners. For deselecting press the button again, which now shows the
     * text 'Deselect'.
     * 
     * @returns {void}
     */
    #select() {
        const selectButton = document.getElementById('selectButton');
        selectButton.innerHTML = 'Deselect';
        selectButton.setAttribute("data-effect", "deselect");

        this.#setSelectedRegion();
        this.#drawSelectedRegion();
        this.#createMarginsForResizing();
    }

    /**
     * Part of the #select() method. Sets the selected region to the whole image.
     * 
     * @returns {void}
     */
    #setSelectedRegion() {
        this.#selectRegion = {
            startX: 0,
            endX: this.#canvasSelectRegion.width,
            startY: 0,
            endY: this.#canvasSelectRegion.height,
        };
    }

    /**
     * Part of the #select() method. Draws the selected region.
     * 
     * @returns {void}
     */
    #drawSelectedRegion() {
        const width = this.#selectRegion.endX - this.#selectRegion.startX;
        const height = this.#selectRegion.endY - this.#selectRegion.startY; 
    
        this.#canvasSelectRegionContext.strokeStyle = 'crimson';
        this.#canvasSelectRegionContext.lineWidth = 10;

        this.#canvasSelectRegionContext.strokeRect(this.#selectRegion.startX + 5, 
            this.#selectRegion.startY + 5, width - 10, height - 10);
    }

    /**
     * Part of the #select() method. Sets and draws the corners of the selected region.
     * Sets the event listeners on the corners.
     * 
     * @returns {void}
     */
    #createMarginsForResizing() {
        this.#marginsSelection = [];
        for (let i=0; i<4; i++) {
            this.#marginsSelection.push({canvas: null, context: null});
            this.#marginsSelection[i].canvas = document.createElement("canvas");
            this.#marginsSelection[i].canvas.width = 10;
            this.#marginsSelection[i].canvas.height = 10;
            this.#marginsSelection[i].context = this.#marginsSelection[i].canvas.getContext("2d");
            this.#marginsSelection[i].canvas.id = "canvasMargin" + i;
            document.body.appendChild(this.#marginsSelection[i].canvas);
        }
        const rect = this.#canvasSelectRegion.getBoundingClientRect();
    
        this.#marginsSelection[0].canvas.style.top = rect.top + "px";
        this.#marginsSelection[0].canvas.style.left = rect.left + "px";

        this.#marginsSelection[1].canvas.style.top = rect.top + "px";
        this.#marginsSelection[1].canvas.style.right = rect.left + "px";

        this.#marginsSelection[2].canvas.style.bottom = rect.top + "px";
        this.#marginsSelection[2].canvas.style.left = rect.left + "px";

        this.#marginsSelection[3].canvas.style.bottom = rect.top + "px";
        this.#marginsSelection[3].canvas.style.right = rect.left + "px";

        for(let i=0; i<4; i++) {
            this.#marginsSelection[i].canvas.style.position = "fixed";
            this.#marginsSelection[i].context.fillStyle = 'green';
            this.#marginsSelection[i].context.fillRect(0, 0, 
                this.#marginsSelection[i].canvas.width, this.#marginsSelection[i].canvas.width);
        }

        this.#addCornersFunctionality();
    }

    /**
     * Part of the #createMarginsForResizing() method which is itself part of the #select() method.
     * Sets the event listeners on the corners.
     * 
     * @returns {void}
     */
    #addCornersFunctionality() {
        for(let i=0; i<4; i++) {
            this.#marginsSelection[i].canvas.addEventListener('mousedown', (eventObject) => {
                this.#clickCornerSelection(eventObject);
            });
            this.#marginsSelection[i].canvas.addEventListener('mousemove', (eventObject) => {
                this.#dragCornerSelection(eventObject, i);
            });
        }
    }

    /**
     * Sets the mouse coordinates and isDraging to true when left click is pressed on a corner.
     * 
     * @param {MouseEvent} eventObject
     * @param {HTMLCanvasElement} canvasMargin0
     * 
     * @returns {void}
     */
    #clickCornerSelection(eventObject) {
        if (eventObject.button !== 0)
            return;
        this.#mouseCoordinates = {
            initialX: eventObject.clientX,
            initialY: eventObject.clientY,
            currentX: eventObject.clientX,
            currentY: eventObject.clientY
        };

        this.#isDragging = true;
    }

    /**
     * Calls the right method for the corner that is being dragged.
     * 
     * @param {MouseEvent} eventObject 
     * @param {number} i 
     * 
     * @returns {void}
     */
    #dragCornerSelection(eventObject, i) {
        if (!this.#isDragging)
            return;
        switch(i) {
            case 0:
                this.#dragTopLeft(eventObject);
                break;
            case 1:
                this.#dragTopRight(eventObject);
                break;
            case 2:
                this.#dragBottomLeft(eventObject);
                break;
            case 3:
                this.#dragBottomRight(eventObject);
                break;
            default:
                console.error("Corner not found");
                break;
        }
    }

    /**
     * Resizes the top-left region based on the mouse movement.
     * 
     * @param {MouseEvent} eventObject 
     * 
     * @returns {void}
     */
    #dragTopLeft(eventObject) {
        const rect = this.#canvasSelectRegion.getBoundingClientRect();

        const canvasMargin0 = document.getElementById("canvasMargin0");
        const canvasMargin1 = document.getElementById("canvasMargin1");
        const canvasMargin2 = document.getElementById("canvasMargin2");

        this.#mouseCoordinates.currentX = eventObject.clientX;
        this.#mouseCoordinates.currentY = eventObject.clientY;

        if (this.#mouseCoordinates.currentX > rect.left && this.#mouseCoordinates.currentX < rect.right
            && this.#mouseCoordinates.currentY > rect.top && this.#mouseCoordinates.currentY < rect.bottom) { 

            canvasMargin0.style.top = this.#mouseCoordinates.currentY + 'px';
            canvasMargin0.style.left = this.#mouseCoordinates.currentX + 'px';

            canvasMargin1.style.top = this.#mouseCoordinates.currentY + 'px';

            canvasMargin2.style.left = this.#mouseCoordinates.currentX + 'px';

            this.#canvasSelectRegionContext.clearRect(0, 0, this.#canvasSelectRegion.width, 
                this.#canvasSelectRegion.height);

            let shownWidth = rect.right - rect.left;
            let shownHeight = rect.bottom - rect.top;
    
            this.#selectRegion.startX = (this.#mouseCoordinates.currentX - rect.left) * this.#canvasSelectRegion.width / shownWidth;
            this.#selectRegion.startY = (this.#mouseCoordinates.currentY - rect.top) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.endX = (canvasMargin1.getBoundingClientRect().left - rect.left + 10) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.endY = (canvasMargin2.getBoundingClientRect().top - rect.top + 10) * this.#canvasSelectRegion.height / shownHeight;

            console.clear();
            console.log("MOUSE X : MOUSE Y\n" + this.#mouseCoordinates.currentX + "   " + this.#mouseCoordinates.currentY)
            console.log("RECT LEFT : RECT TOP\n" + rect.left + "   " + rect.top);
            console.log("START X : START Y\n" + this.#selectRegion.startX + "   " + this.#selectRegion.startY);
            console.log("CANVASMARGIN0 RECT LEFT : CANVASMARGIN0 RECT TOP\n" + canvasMargin0.getBoundingClientRect().left + "   " + canvasMargin0.getBoundingClientRect().top);
            console.log("CANVAS-SELECT-REGION WIDTH : CANVAS-SELECT-REGION HEIGHT\n" + this.#canvasSelectRegion.width + "   " + this.#canvasSelectRegion.height);

            this.#drawSelectedRegion();
        }
    }

    /**
     * Resizes the top-right region based on the mouse movement.
     * 
     * @param {MouseEvent} eventObject 
     * 
     * @returns {void}
     */
    #dragTopRight(eventObject) {
        const rect = this.#canvasSelectRegion.getBoundingClientRect();

        const canvasMargin0 = document.getElementById("canvasMargin0");
        const canvasMargin1 = document.getElementById("canvasMargin1");
        const canvasMargin3 = document.getElementById("canvasMargin3");

        this.#mouseCoordinates.currentX = eventObject.clientX;
        this.#mouseCoordinates.currentY = eventObject.clientY;

        if (this.#mouseCoordinates.currentX > rect.left && this.#mouseCoordinates.currentX < rect.right
            && this.#mouseCoordinates.currentY > rect.top && this.#mouseCoordinates.currentY < rect.bottom) { 

            canvasMargin1.style.top = this.#mouseCoordinates.currentY + 'px';
            canvasMargin1.style.right = visualViewport.width - this.#mouseCoordinates.currentX + 'px';

            canvasMargin0.style.top = this.#mouseCoordinates.currentY + 'px';

            canvasMargin3.style.right = visualViewport.width - this.#mouseCoordinates.currentX + 'px';

            this.#canvasSelectRegionContext.clearRect(0, 0, this.#canvasSelectRegion.width, 
                this.#canvasSelectRegion.height);

            let shownWidth = rect.right - rect.left;
            let shownHeight = rect.bottom - rect.top;
    
            this.#selectRegion.startX = (canvasMargin0.getBoundingClientRect().left - rect.left) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.startY = (this.#mouseCoordinates.currentY - rect.top) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.endX = (this.#mouseCoordinates.currentX - rect.left) * this.#canvasSelectRegion.width / shownWidth;
            this.#selectRegion.endY = (canvasMargin3.getBoundingClientRect().top - rect.top + 10) * this.#canvasSelectRegion.height / shownHeight;

            this.#drawSelectedRegion();
        }
    }

    /**
     * Resizes the bottom-left region based on the mouse movement.
     * 
     * @param {MouseEvent} eventObject 
     * 
     * @returns {void}
     */
    #dragBottomLeft(eventObject) {
        const rect = this.#canvasSelectRegion.getBoundingClientRect();

        const canvasMargin0 = document.getElementById("canvasMargin0");
        const canvasMargin2 = document.getElementById("canvasMargin2");
        const canvasMargin3 = document.getElementById("canvasMargin3");

        this.#mouseCoordinates.currentX = eventObject.clientX;
        this.#mouseCoordinates.currentY = eventObject.clientY;

        if (this.#mouseCoordinates.currentX > rect.left && this.#mouseCoordinates.currentX < rect.right
            && this.#mouseCoordinates.currentY > rect.top && this.#mouseCoordinates.currentY < rect.bottom) { 

            canvasMargin0.style.left = this.#mouseCoordinates.currentX + 'px';
            
            canvasMargin2.style.left = this.#mouseCoordinates.currentX + 'px';
            canvasMargin2.style.bottom = visualViewport.height - this.#mouseCoordinates.currentY + 'px';

            canvasMargin3.style.bottom = visualViewport.height - this.#mouseCoordinates.currentY + 'px';

            this.#canvasSelectRegionContext.clearRect(0, 0, this.#canvasSelectRegion.width, 
                this.#canvasSelectRegion.height);

            let shownWidth = rect.right - rect.left;
            let shownHeight = rect.bottom - rect.top;
    
            this.#selectRegion.startX = (this.#mouseCoordinates.currentX - rect.left) * this.#canvasSelectRegion.width / shownWidth;
            this.#selectRegion.startY = (canvasMargin0.getBoundingClientRect().top - rect.top) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.endX = (canvasMargin3.getBoundingClientRect().left - rect.left + 10) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.endY = (this.#mouseCoordinates.currentY - rect.top) * this.#canvasSelectRegion.height / shownHeight;

            this.#drawSelectedRegion();
        }
    }

    /**
     * Resizes the bottom-right region based on the mouse movement.
     * 
     * @param {MouseEvent} eventObject 
     * 
     * @returns {void}
     */
    #dragBottomRight(eventObject) {
        const rect = this.#canvasSelectRegion.getBoundingClientRect();

        const canvasMargin1 = document.getElementById("canvasMargin1");
        const canvasMargin2 = document.getElementById("canvasMargin2");
        const canvasMargin3 = document.getElementById("canvasMargin3");

        this.#mouseCoordinates.currentX = eventObject.clientX;
        this.#mouseCoordinates.currentY = eventObject.clientY;

        if (this.#mouseCoordinates.currentX > rect.left && this.#mouseCoordinates.currentX < rect.right
            && this.#mouseCoordinates.currentY > rect.top && this.#mouseCoordinates.currentY < rect.bottom) { 

            canvasMargin1.style.right = visualViewport.width - this.#mouseCoordinates.currentX + 'px';

            canvasMargin2.style.bottom = visualViewport.height - this.#mouseCoordinates.currentY + 'px';

            canvasMargin3.style.right = visualViewport.width - this.#mouseCoordinates.currentX + 'px';
            canvasMargin3.style.bottom = visualViewport.height - this.#mouseCoordinates.currentY + 'px';

            this.#canvasSelectRegionContext.clearRect(0, 0, this.#canvasSelectRegion.width, 
                this.#canvasSelectRegion.height);

            let shownWidth = rect.right - rect.left;
            let shownHeight = rect.bottom - rect.top;
    
            this.#selectRegion.startX = (canvasMargin2.getBoundingClientRect().left - rect.left) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.startY = (canvasMargin1.getBoundingClientRect().top - rect.top) * this.#canvasSelectRegion.height / shownHeight;
            this.#selectRegion.endX = (this.#mouseCoordinates.currentX - rect.left) * this.#canvasSelectRegion.width / shownWidth;
            this.#selectRegion.endY = (this.#mouseCoordinates.currentY - rect.top) * this.#canvasSelectRegion.height / shownHeight;

            this.#drawSelectedRegion();
        }
    }

    /**
     * Stops the select effect while keeping any changes made. The button's functinality transitions
     * back to select.
     * 
     * @returns {void}
     */
    #deselect() {
        const selectButton = document.getElementById('selectButton');
        selectButton.innerHTML = 'Select';
        selectButton.setAttribute("data-effect", "select");

        this.#canvasSelectRegionContext.clearRect(0, 0, this.#canvasSelectRegion.width, 
            this.#canvasSelectRegion.height);

        for (let i=0; i<this.#marginsSelection.length; i++) {
            document.body.removeChild(this.#marginsSelection[i].canvas);
        }
    }

    /**
     * Saves the current image
     * 
     * @returns {void}
     */
    saveImage() {
        const link = document.createElement("a");
        link.download = "image.jpeg";
        link.href = this.#canvasVisibleContent.toDataURL("image/jpeg");
        link.click();
    }

    /**
     * Binds the HTML elements to the functionality provided by the js script.
     * That is, drag and drop, selecting a file, effects, saving etc.
     * 
     * @returns {void}
     */
    static initializeFunctionality() {
        'use strict';

        const imageEditor = new ImageEditor(document.getElementById("canvasVisibleContent"));

        const fileBrowser = document.getElementById("fileBrowser");
        fileBrowser.addEventListener('change', () => {
            const files = fileBrowser.files;
            if (files.length > 0) {
                const file = files[0];

                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    const dataUrl = reader.result;

                    const img = document.createElement('img');
                    img.addEventListener('load', () => {
                        imageEditor.changeImage(img);
                    });
                    img.src = dataUrl;
                });
                reader.readAsDataURL(file);
            }
        });

        const buttons = document.querySelectorAll('[data-effect]');
        for (let i=0; i<buttons.length; i++) {
            buttons[i].addEventListener('click', () => {
                imageEditor.changeEffect(buttons[i].dataset.effect);
            });
        }

        document.getElementById('buttonSave').addEventListener('click', () => {
            imageEditor.saveImage();
        });

        document.addEventListener('dragover', (eventObject) => {
            eventObject.preventDefault();
        });

        document.addEventListener('drop', (eventObject) => {
            eventObject.preventDefault();

            const files = eventObject.dataTransfer.files;

            if (files.length > 0) {
                const reader = new FileReader();
                
                reader.addEventListener('load', (eventObject) => {
                    const img = document.createElement('img');
                    
                    img.addEventListener('load', () => {
                        imageEditor.changeImage(img);
                    });

                    img.setAttribute('src', eventObject.target.result);
                });

                reader.readAsDataURL(files[0]);
            }
        });

        window.addEventListener('resize', function() {
            for (let i=0; i<imageEditor.#marginsSelection.length; i++) {
                document.body.removeChild(imageEditor.#marginsSelection[i].canvas);
            }
            imageEditor.#createMarginsForResizing();
        });

        document.addEventListener('mouseup', function () {
            imageEditor.#isDragging = false;
        });
    }
}