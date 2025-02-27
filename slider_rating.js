// slider_rating.js

let sliderValues = {}; // Declare globally to ensure availability

function getSliderRatingPhase(blockIndex) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            let lastBlockData = jsPsych.data.get().filter({ block: blockIndex }).last(1).values()[0];

            if (!lastBlockData || !lastBlockData.shapeA) {
                console.error(`Error: Could not retrieve block data for block ${blockIndex}.`);
                return `<p style="color:red;">Error: Could not load the rating phase. Please check the experiment code.</p>`;
            }

            let shapeA = lastBlockData.shapeA;
            let shapeB = lastBlockData.shapeB;
            let shapeC = lastBlockData.shapeC;
            
            return `
                <style>
                    input[type="range"]::-webkit-slider-runnable-track {
                        background: black;
                        height: 10px;
                        border-radius: 2px;
                    }
                    input[type="range"]::-moz-range-track {
                        background: black;
                        height: 10px;
                        border-radius: 2px;
                    }
                    input[type="range"].slider-visible::-webkit-slider-thumb {
                        background: white;
                        width: 6px;
                        height: 18px;
                        border-radius: 2px;
                        cursor: pointer;
                        margin-top: -7px;
                    }
                    input[type="range"].slider-hidden::-webkit-slider-thumb {
                        visibility: hidden;
                    }
                    .slider-label {
                        position: absolute;
                        font-size: 16px;
                        font-weight: bold;
                        transform: translateX(-50%);
                        top: -35px;
                    }
                    .slider-label.hidden {
                        visibility: hidden;
                    }
                    .slider-label.blue {
                        color: rgb(0, 127, 255); /* Blue */
                    }
                    .slider-label.orange {
                        color: rgb(255, 127, 0); /* Orange */
                    }
                    .slider-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 20px;
                    }
                </style>
                <div style="text-align:center;">
                    <p style="font-size:24px; color:white;">How likely each symbol came from the blue vs. orange bag?</p>
                    <div class="rating-container">
                        ${generateSliderBlock("A", shapeA)}
                        ${generateSliderBlock("B", shapeB)}
                        ${generateSliderBlock("C", shapeC)}
                    </div>
                </div>`;
        },
        choices: ["Submit"],
        on_load: function() {
            sliderValues[blockIndex] = { sliderA: null, sliderB: null, sliderC: null };
            let submitButton = document.querySelector("button");
            submitButton.disabled = true;

            function checkAllSlidersMoved() {
                if (sliderValues[blockIndex].sliderA !== null && 
                    sliderValues[blockIndex].sliderB !== null && 
                    sliderValues[blockIndex].sliderC !== null) {
                    submitButton.disabled = false;
                }
            }

            function updateSlider(sliderLeft, sliderRight, shape, sliderKey, labelLeft, labelRight) {
                let leftSlider = document.getElementById(sliderLeft);
                let rightSlider = document.getElementById(sliderRight);
                let leftLabel = document.getElementById(labelLeft);
                let rightLabel = document.getElementById(labelRight);

                function updateLabelPosition(slider, label) {
                    let rect = slider.getBoundingClientRect();
                    let parentRect = slider.parentElement.getBoundingClientRect();
                    label.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
                }

                updateLabelPosition(leftSlider, leftLabel);
                updateLabelPosition(rightSlider, rightLabel);

                leftSlider.addEventListener("input", function() {
                    let value = Number(this.value).toFixed(2);
                    document.getElementById(`img${sliderKey.slice(-1)}`).src = `./img_d/${shape}_${value}.png`;
                    sliderValues[blockIndex][sliderKey] = value;
                    rightSlider.classList.add("slider-hidden");
                    leftSlider.classList.remove("slider-hidden");
                    rightLabel.classList.add("hidden");
                    leftLabel.classList.remove("hidden");
                    checkAllSlidersMoved();
                    updateLabelPosition(leftSlider, leftLabel);
                });

                rightSlider.addEventListener("input", function() {
                    let value = Number(this.value).toFixed(2);
                    document.getElementById(`img${sliderKey.slice(-1)}`).src = `./img_d/${shape}_${value}.png`;
                    sliderValues[blockIndex][sliderKey] = value;
                    leftSlider.classList.add("slider-hidden");
                    rightSlider.classList.remove("slider-hidden");
                    leftLabel.classList.add("hidden");
                    rightLabel.classList.remove("hidden");
                    checkAllSlidersMoved();
                    updateLabelPosition(rightSlider, rightLabel);
                });
            }

            let lastBlockData = jsPsych.data.get().filter({ block: blockIndex }).last(1).values()[0];
            if (!lastBlockData) {
                console.error(`Error: Missing data for block ${blockIndex}.`);
                return;
            }

            updateSlider("sliderA_left", "sliderA_right", lastBlockData.shapeA, "sliderA", "labelA_left", "labelA_right");
            updateSlider("sliderB_left", "sliderB_right", lastBlockData.shapeB, "sliderB", "labelB_left", "labelB_right");
            updateSlider("sliderC_left", "sliderC_right", lastBlockData.shapeC, "sliderC", "labelC_left", "labelC_right");

        },

        on_finish: function(data) {
            data.selected_sliders = sliderValues[blockIndex];
            data.block = blockIndex;

            let lastBlockData = jsPsych.data.get().filter({ block: blockIndex }).last(1).values()[0];
            let { cfactA, cfactB, cfactC } = lastBlockData;

            let sliderA = sliderValues[blockIndex].sliderA ?? 0; // Default to 0 if null
            let sliderB = sliderValues[blockIndex].sliderB ?? 0;
            let sliderC = sliderValues[blockIndex].sliderC ?? 0;

            let answerResultA = checkAnswer(cfactA, sliderA);
            let answerResultB = checkAnswer(cfactB, sliderB);
            let answerResultC = checkAnswer(cfactC, sliderC);

            console.log(`Answer shape A check result for block ${blockIndex}: ${answerResultA}`);
            console.log(`Answer shape B check result for block ${blockIndex}: ${answerResultB}`);
            console.log(`Answer shape C check result for block ${blockIndex}: ${answerResultC}`);

                // Map Correct/Wrong to Image Paths
            let imgA = answerResultA === "Correct" ? "./img_d/green_check_mark.png" : "./img_d/red_x_mark.png";
            let imgB = answerResultB === "Correct" ? "./img_d/green_check_mark.png" : "./img_d/red_x_mark.png";
            let imgC = answerResultC === "Correct" ? "./img_d/green_check_mark.png" : "./img_d/red_x_mark.png";

            console.log("New image paths:", imgA, imgB, imgC);

            let feedbackHTML = `
                <div id="feedback-container" style="text-align:center; margin-top:20px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                    <p style="font-size:20px; color:white;">Correctness of last test:</p>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <img src="./img_d/${answerResultA === 'Correct' ? 'green_check_mark.png' : 'red_x_mark.png'}" width="150">
                        <img src="./img_d/${answerResultB === 'Correct' ? 'green_check_mark.png' : 'red_x_mark.png'}" width="150">
                        <img src="./img_d/${answerResultC === 'Correct' ? 'green_check_mark.png' : 'red_x_mark.png'}" width="150">
                    </div>
                </div>
            `;

            // Display the feedback after a short delay
            setTimeout(() => {
                jsPsych.getDisplayElement().insertAdjacentHTML("beforeend", feedbackHTML);
                
                // ✅ Automatically remove feedback after 3 seconds to prevent overlap
                setTimeout(() => {
                    let feedbackElem = document.getElementById("feedback-container");
                    if (feedbackElem) {
                        feedbackElem.remove();
                    }
                }, 3000);
            }, 100);
            
        }
    };
}


function generateSliderBlock(shapeId, shape) {
    return `
        <div>
            <img id="img${shapeId}" src="./img_d/${shape}_0.00.png" width="150"><br>
            <div class="slider-wrapper">
                <div id="label${shapeId}_left" class="slider-label blue">Blue</div>
                <input id="slider${shapeId}_left" type="range" min="-1" max="-0.2" step="0.02" value="-0.6" style="width:180px;" class="slider-visible">
                <input id="slider${shapeId}_right" type="range" min="0.2" max="1" step="0.02" value="0.6" style="width:180px;" class="slider-visible">
                <div id="label${shapeId}_right" class="slider-label orange">Orange</div>
            </div>
        </div>`;
}


function checkAnswer(cfact, slider) {
    let correctAnswer = cfact ? "orange" : "blue";
    let userCorrect = cfact ? slider > 0 : slider < 0;
    
    return userCorrect ? "Correct" : "Wrong";
}
