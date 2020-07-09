/*!
 * Elevator.js
 *
 * MIT licensed
 * Copyright (C) 2015 Tim Holman, http://tholman.com
 */

/*********************************************
 * Elevator.js
 *********************************************/

class Elevator {
    constructor(options) {

        // Elements
        this.body = null;

        // Scroll vars
        this.animation = null;
        this.duration = null; // ms
        this.customDuration = false;
        this.startTime = null;
        this.startPosition = null;
        this.endPosition = 0;
        this.targetElement = null;
        this.verticalPadding = null;
        this.elevating = false;

        this.startCallback;
        this.mainAudio;
        this.endAudio;
        this.endCallback;

        this.init(options)
    }

    /**
    * Utils
    */
    getVerticalOffset(element) {
        const verticalOffset = 0;
        while (element) {
            verticalOffset += element.offsetTop || 0;
            element = element.offsetParent;
        }

        if (this.verticalPadding) {
            verticalOffset = verticalOffset - verticalPadding;
        }

        return verticalOffset;
    }

    /**
     * Main
     */

    // Time is passed through requestAnimationFrame, what a world!
    animateLoop(time) {
        if (!this.startTime) {
            this.startTime = time;
        }

        const timeSoFar = time - this.startTime;
        const easedPosition = easeInOutQuad(
            timeSoFar,
            this.startPosition,
            this.endPosition - this.startPosition,
            this.duration
        );

        window.scrollTo(0, easedPosition);

        if (timeSoFar < this.duration) {
            this.animation = requestAnimationFrame(this.animateLoop.bind(this));
        } else {
            this.animationFinished();
        }
    }

    //            ELEVATE!
    //              /
    //         ____
    //       .'    '=====<0
    //       |======|
    //       |======|
    //       [IIIIII[\--()
    //       |_______|
    //       C O O O D
    //      C O  O  O D
    //     C  O  O  O  D
    //     C__O__O__O__D
    //    [_____________]
    elevate() {
        if (this.elevating) {
            return;
        }

        this.elevating = true;
        this.startPosition = document.documentElement.scrollTop || body.scrollTop;
        this.updateEndPosition();

        // No custom duration set, so we travel at pixels per millisecond. (0.75px per ms)
        if (!this.customDuration) {
            this.duration = Math.abs(this.endPosition - this.startPosition) * 1.5;
        }

        requestAnimationFrame(this.animateLoop.bind(this));

        // Start music!
        if (this.mainAudio) {
            this.mainAudio.play();
        }

        if (this.startCallback) {
            this.startCallback();
        }
    };

    resetPositions() {
        this.startTime = null;
        this.startPosition = null;
        this.elevating = false;
    }

    updateEndPosition() {
        if (this.targetElement) {
            this.endPosition = this.getVerticalOffset(targetElement);
        }
    }

    animationFinished() {
        this.resetPositions();

        // Stop music!
        if (this.mainAudio) {
            this.mainAudio.pause();
            this.mainAudio.currentTime = 0;
        }

        if (this.endAudio) {
            this.endAudio.play();
        }

        if (this.endCallback) {
            this.endCallback();
        }
    }

    onWindowBlur() {
        // If animating, go straight to the top. And play no more music.
        if (this.elevating) {
            this.cancelAnimationFrame(animation);
            this.resetPositions();

            if (this.mainAudio) {
                this.mainAudio.pause();
                this.mainAudio.currentTime = 0;
            }

            this.updateEndPosition();
            window.scrollTo(0, this.endPosition);
        }
    }

    bindElevateToElement(element) {
        if (element.addEventListener) {
            element.addEventListener("click", this.elevate.bind(this), false);
        } else {
            // Older browsers
            element.attachEvent("onclick", function() {
                this.updateEndPosition();
                document.documentElement.scrollTop = endPosition;
                document.body.scrollTop = endPosition;
                window.scroll(0, endPosition);
            });
        }
    }

    init(_options) {
		// Take the stairs instead
		if (!browserMeetsRequirements()) {
			return;
		}

        // Bind to element click event.
        this.body = document.body;

        const defaults = {
            duration: undefined,
            mainAudio: false,
            endAudio: false,
            preloadAudio: true,
            loopAudio: true,
            startCallback: null,
            endCallback: null
        };

        _options = extendParameters(_options, defaults);

        if (_options.element) {
            this.bindElevateToElement(_options.element);
        }

        if (_options.duration) {
            this.customDuration = true;
            this.duration = _options.duration;
        }

        if (_options.targetElement) {
            this.targetElement = _options.targetElement;
        }

        if (_options.verticalPadding) {
            this.verticalPadding = _options.verticalPadding;
        }

        window.addEventListener("blur", this.onWindowBlur.bind(this), false);

        if (_options.mainAudio) {
            this.mainAudio = new Audio(_options.mainAudio);
            this.mainAudio.setAttribute("preload", _options.preloadAudio);
            this.mainAudio.setAttribute("loop", _options.loopAudio);
        }

        if (_options.endAudio) {
            this.endAudio = new Audio(_options.endAudio);
            this.endAudio.setAttribute("preload", "true");
        }

        if (_options.endCallback) {
            this.endCallback = _options.endCallback;
        }

        if (_options.startCallback) {
            this.startCallback = _options.startCallback;
        }
    }
};

/**
* Utils
*/

// Thanks Mr Penner - http://robertpenner.com/easing/
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

function extendParameters(options, defaults) {
    for (const option in defaults) {
        const t = options[option] === undefined && typeof option !== "function";
        if (t) {
            options[option] = defaults[option];
        }
    }
    return options;
}

function browserMeetsRequirements() {
    return (
        window.requestAnimationFrame &&
        window.Audio &&
        window.addEventListener
    );
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = Elevator;
}
