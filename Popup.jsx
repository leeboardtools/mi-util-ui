import React from 'react';
import PropTypes from 'prop-types';
import { getPositionedAncestor, getParentClipBounds } from '../util/ElementUtils';


function pixelsEqual(a, b) {
    if (a === b) {
        return true;
    }
    else if ((a === undefined) || (b === undefined)) {
        return false;
    }
    return Math.round(a) === Math.round(b);
}


const HALIGN = {
    left: 'min',
    center: 'center',
    right: 'max',
    none: 'none',
};

const VALIGN = {
    top: 'min',
    center: 'center',
    bottom: 'max',
    none: 'none',
};

function calcAlignPoint({ align, alignEnum, lowerValue, upperValue, }) {
    switch (alignEnum[align]) {
    case 'min' :
    default :
        return lowerValue;
    
    case 'center' :
        return 0.5 * (lowerValue + upperValue);
    
    case 'max' :
        return upperValue;
    }
}

function calcAlignment({ refArgs, popupArgs, minLowerValue, maxUpperValue, }) {
    if (popupArgs.align === 'none') {
        return popupArgs.lowerValue;
    }

    const refAlignPoint = calcAlignPoint(refArgs);
    const popupAlignPoint = calcAlignPoint(popupArgs);

    let lowerValue = popupArgs.lowerValue + refAlignPoint - popupAlignPoint;
    let upperValue = lowerValue + popupArgs.upperValue - popupArgs.lowerValue;
    let isFlipped;

    if (minLowerValue !== undefined) {
        const span = upperValue - lowerValue;
        if (lowerValue < minLowerValue) {
            if (upperValue === refArgs.lowerValue) {
                // The popup right edge aligned to the ref left edge,
                // try flipping to the other side.
                if (refArgs.upperValue + span <= maxUpperValue) {
                    // We're good to adjust...
                    lowerValue = refArgs.upperValue;
                    upperValue = lowerValue + span;
                    isFlipped = true;
                }
            }
            if (lowerValue < minLowerValue) {
                upperValue = Math.min(maxUpperValue, minLowerValue + span);
                lowerValue = minLowerValue;
            }
        }

        if (upperValue > maxUpperValue) {
            if (lowerValue === refArgs.upperValue) {
                if (refArgs.lowerValue - span >= minLowerValue) {
                    lowerValue = refArgs.lowerValue - span;
                    upperValue = refArgs.lowerValue;
                    isFlipped = true;
                }
            }
            if (upperValue > maxUpperValue) {
                lowerValue = Math.max(minLowerValue, maxUpperValue - span);
                upperValue = maxUpperValue;
            }
        }
    }

    let pointerValue;

    // Cases:
    //       l    ref    u
    //  l A u
    //  l  B  u
    //  l          C          u
    //         l  D  u
    //         l  E           u
    //                    l F u
    if (lowerValue < refArgs.lowerValue) {
        // Cases A, B, C
        if (upperValue >= refArgs.lowerValue) {
            // Cases B, C
            if (upperValue > refArgs.upperValue) {
                // Case C
                pointerValue = (refArgs.lowerValue + refArgs.upperValue) / 2;
            }
            else {
                // Case B
                pointerValue = (refArgs.lowerValue + upperValue) / 2;
            }
        }
        else {
            // Case A
            pointerValue = upperValue;
        }
    }
    else if (lowerValue < refArgs.upperValue) {
        // Cases D, E
        if (upperValue < refArgs.upperValue) {
            // Case D
            pointerValue = (lowerValue + upperValue) / 2;
        }
        else {
            // Case E
            pointerValue = (lowerValue + refArgs.upperValue) / 2;
        }
    }
    else {
        // Case F
        pointerValue = upperValue;
    }

    const pointerMargin = 5;
    pointerValue = Math.min(
        Math.max(pointerValue, lowerValue + pointerMargin), 
        upperValue - pointerMargin);

    return {
        lowerValue: lowerValue,
        upperValue: upperValue,
        pointerValue: pointerValue - lowerValue,
        isFlipped: isFlipped,
    };
}


/**
 * React component that pops up. Used by {@link DropdownSelector}, {@link MenuList},
 * and {@link Tooltip}.
 */
export class Popup extends React.Component {
    constructor(props) {
        super(props);

        this.onKeyDown = this.onKeyDown.bind(this);

        this._popupRef = React.createRef();
        this._containerRef = React.createRef();

        this.state = {
            left: this.props.x,
            top: this.props.y,
        };
    }


    componentDidMount() {
        this.updateLayout();
        this._popupRef.current.focus();
    }


    componentDidUpdate(prevProps, prevState) {
        this.updateLayout();
    }


    updateLayout() {
        const { props } = this;
        if (props.show && this._containerRef.current) {
            const container = this._containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            const popupStyle = window.getComputedStyle(this._popupRef.current);
            const isFixedPosition = popupStyle.getPropertyValue('position') === 'fixed';

            const { state } = this;

            let minLeft;
            let minTop;
            let maxRight;
            let maxBottom;

            let isDocSizeChange;

            const { clientWidth : docWidth, clientHeight: docHeight } 
                = document.documentElement;
            if (isFixedPosition) {
                minLeft = 2;
                minTop = 2;
                maxRight = docWidth - 2;
                maxBottom = docHeight - 2;

                isDocSizeChange = (docWidth !== state.docWidth)
                    || (docHeight !== state.docHeight);
            }
            else {
                const boundsRect = getParentClipBounds(this._popupRef.current);
                minLeft = boundsRect.left + 2;
                minTop = boundsRect.top + 2;
                maxRight = boundsRect.right - 2;
                maxBottom = boundsRect.bottom - 2;
            }

            let prevWidth;
            let prevHeight;
            if (pixelsEqual(containerWidth, state.containerWidth)
             && pixelsEqual(containerHeight, state.containerHeight)) {
                prevWidth = state.prevWidth;
                prevHeight = state.prevHeight;
            }

            let left = props.x;
            let top = props.y;

            let refElement;
            const { parentElement } = this._popupRef.current;
            refElement = parentElement;
            if (parentElement) {
                const { children } = parentElement;
                if (children) {
                    for (let i = 0; i < children.length; ++i) {
                        const child = children[i];
                        if (child !== this._popupRef.current) {
                            // TODO: Should probably check if the child is visible!
                            refElement = child;
                            break;
                        }
                    }
                }
            }

            let right;
            let bottom;

            let pointerLocation;
            let pointerX;
            let pointerY;

            const refRect = (refElement) ? refElement.getBoundingClientRect() 
                : undefined;
            if (refRect) {
                let hAlignParent = props.hAlignParent || 'left';
                let hAlignPopup = props.hAlignPopup || 'left';
                let vAlignParent = props.vAlignParent || 'bottom';
                let vAlignPopup = props.vAlignPopup || 'top';
                let isXFlipped;
                let isYFlipped;

                if (left === undefined) {
                    const result = calcAlignment({
                        refArgs: {
                            align: hAlignParent,
                            alignEnum: HALIGN,
                            lowerValue: refRect.left,
                            upperValue: refRect.right,
                        },
                        popupArgs: {
                            align: hAlignPopup,
                            alignEnum: HALIGN,
                            lowerValue: 0,
                            upperValue: containerWidth,
                        },
                        minLowerValue: minLeft,
                        maxUpperValue: maxRight,
                    });

                    left = result.lowerValue;
                    right = result.upperValue;
                    pointerX = result.pointerValue;
                    isXFlipped = result.isFlipped;
                }

                if (top === undefined) {
                    const result = calcAlignment({
                        refArgs: {
                            align: vAlignParent,
                            alignEnum: VALIGN,
                            lowerValue: refRect.top,
                            upperValue: refRect.bottom,
                        },
                        popupArgs: {
                            align: vAlignPopup,
                            alignEnum: VALIGN,
                            lowerValue: 0,
                            upperValue: containerHeight,
                        },
                        minLowerValue: minTop,
                        maxUpperValue: maxBottom,
                    });

                    top = result.lowerValue;
                    bottom = result.upperValue;
                    pointerY = result.pointerValue;
                    isYFlipped = result.isFlipped;
                }


                if (props.isPointer) {
                    switch (vAlignParent) {
                    case 'top' :
                        if (vAlignPopup === 'bottom') {
                            pointerLocation = (isYFlipped)
                                ? 'top' : 'bottom';
                        }
                        break;
                    
                    case 'bottom' :
                        if (vAlignPopup === 'top') {
                            pointerLocation = (isYFlipped)
                                ? 'bottom' : 'top';
                        }
                        break;
                    }

                    if (!pointerLocation) {
                        switch (hAlignParent) {
                        case 'left' :
                            if (hAlignPopup === 'right') {
                                pointerLocation = (isXFlipped)
                                    ? 'left' : 'right';
                            }
                            break;
                        
                        case 'right' :
                            if (hAlignPopup === 'left') {
                                pointerLocation = (isXFlipped)
                                    ? 'right' : 'left';
                            }
                            break;
                        }
                    }
                }
                else {
                    pointerX = undefined;
                    pointerY = undefined;
                }

            }

            if (right === undefined) {
                right = left + containerWidth;
                if (right > maxRight) {
                    right = maxRight;
                    left = Math.max(maxRight - containerWidth, minLeft);
                }
            }
            if (bottom === undefined) {
                bottom = top + containerHeight;
                if (bottom > maxBottom) {
                    bottom = maxBottom;
                    top = Math.max(maxBottom - containerHeight, minTop);
                }
            }

            let width = right - left;
            let height = bottom - top;

            if (!isFixedPosition) {
                let xAdjust = window.scrollX;
                let yAdjust = window.scrollY;

                const positionedAncestor = getPositionedAncestor(this._popupRef.current);
                if (positionedAncestor) {
                    const frameRect = positionedAncestor.getBoundingClientRect();
                    xAdjust -= frameRect.left;
                    yAdjust -= frameRect.top;
                }

                left += xAdjust;
                top += yAdjust;
            }

            // Prevent flipping back and forth between two sizes.
            if (!isDocSizeChange
             && (pixelsEqual(state.left, left) || pixelsEqual(state.prevLeft, left))
             && (pixelsEqual(state.top, top) || pixelsEqual(state.prevTop, top))
             && (pixelsEqual(state.width, width) || pixelsEqual(prevWidth, width))
             && (pixelsEqual(state.height, height) || pixelsEqual(prevHeight, height))) {
                left = state.left;
                top = state.top;
                width = state.width;
                height = state.height;
            }

            if (!pixelsEqual(state.left, left) || !pixelsEqual(state.top, top)
             || !pixelsEqual(state.width, width) || !pixelsEqual(state.height, height)
             || !pixelsEqual(state.pointerX, pointerX) 
             || !pixelsEqual(state.pointerY, pointerY)
             || (state.pointerLocation !== pointerLocation)) {
                if (props.isDebug) {
                    console.log({
                        width: width,
                        height: height,
                        pointerLocation: pointerLocation,
                    });
                }

                this.setState({
                    left: left,
                    top: top,
                    width: width,
                    height: height,
                    prevLeft: state.left,
                    prevTop: state.top,
                    prevWidth: state.width,
                    prevHeight: state.height,
                    pointerX: pointerX,
                    pointerY: pointerY,
                    pointerLocation: pointerLocation,
                    docWidth: docWidth,
                    docHeight: docHeight,
                    containerWidth: containerWidth,
                    containerHeight: containerHeight,
                });
            }
        }
    }


    getBoundingClientRect() {
        return this._popupRef.current.getBoundingClientRect();
    }


    close() {
        if (this.props.show) {
            const { onClose } = this.props;
            if (onClose) {
                onClose();
            }
        }
    }


    onKeyDown(e) {
        if (this.props.show) {
            if (e.key === 'Escape') {
                this.close();
            }
        }
    }


    render() {
        const { show, children, classExtras, tabIndex,
            isPointer } = this.props;
        const { state } = this;

        const style = {
            top: state.top,
            left: state.left,
            width: state.width,
            height: state.height,
        };

        let className = 'Popup';
        if (show) {
            className += ' show';
        }
        if (classExtras) {
            className += ' ' + classExtras;
        }

        let contents = <div className = "Popup-container"
            ref = {this._containerRef}
        >
            {children}
        </div>;

        let pointer;
        if (isPointer && show && state.height && state.pointerLocation) {
            let pointerClassName = 'Popup-pointer ' + state.pointerLocation;
            const { pointerClassExtras } = this.props;
            if (pointerClassExtras) {
                pointerClassName += ' ' + pointerClassExtras;
            }

            const pointerStyle = {};
            switch (state.pointerLocation) {
            case 'left' :
            case 'right' :
                pointerStyle.top = state.pointerY;
                pointerStyle.height = 0;
                break;

            case 'top' :
            case 'bottom' :
                pointerStyle.left = state.pointerX;
                pointerStyle.width = 0;
                break;
            }

            pointer = <div className = {pointerClassName}
                style = {pointerStyle}
            />;

            const pointerContainerClassName = 'Popup-pointerContainer '
                + state.pointerLocation;
            switch (state.pointerLocation) {
            case 'left' :
                contents = <div className = {pointerContainerClassName}>
                    {pointer}
                    {contents}
                </div>;
                break;
            
            case 'right' :
                contents = <div className = {pointerContainerClassName}>
                    {contents}
                    {pointer}
                </div>;
                break;

            case 'top' :
                contents = <div className = {pointerContainerClassName}>
                    {pointer}
                    {contents}
                </div>;
                break;
            
            case 'bottom' :
                contents = <div className = {pointerContainerClassName}>
                    {contents}
                    {pointer}
                </div>;
                break;
            }
        }

        return <div className = {className}
            style = {style}
            onKeyDown = {this.onKeyDown}
            tabIndex = {tabIndex}
            ref = {this._popupRef}
        >
            {contents}
        </div>;
    }
}


/**
 * Callback called when the popup is closed.
 * @callback Popup~onClose
 */

/**
 * @typedef {object} Popup~propTypes
 * @property {number} [x]
 * @property {number} [y]
 * @property {string} [hAlignParent='left'] Where on the parent to align horizontally, 
 * 'left', 'center', or 'right'
 * @property {string} [hAlignPopup='left'] Where on the popup to align with the parent
 * hAlignParent alignment point, one of 'left', 'center', or 'right'.
 * @property {string} [vAlignParent='top'] Where on the parent to align vertically, 
 * 'top', 'center', or 'bottom'
 * @property {string} [vAlignPopup='top'] Where on the popup to align with the parent
 * vAlignParent alignment point, one of 'top', 'center', or 'bottom'.
 * @property {boolean} [show]
 * @property {Popup~onClose} [onClose]
 * @property {number} [tabIndex]
 * @property {string} [classExtras]
 * @property {string} [pointerClassExtras]
 * @property {boolean} [isPointer] If truthy a pointer is drawn along the edge towards
 * the parent, normally used for the tooltip pointer.
 */
Popup.propTypes = {
    id: PropTypes.any,
    x: PropTypes.number,
    y: PropTypes.number,
    hAlignParent: PropTypes.string,
    hAlignPopup: PropTypes.string,
    vAlignParent: PropTypes.string,
    vAlignPopup: PropTypes.string,
    show: PropTypes.bool,
    onClose: PropTypes.func,
    tabIndex: PropTypes.number,
    classExtras: PropTypes.string,
    pointerClassExtras: PropTypes.string,
    isPointer: PropTypes.bool,
    children: PropTypes.any,
    isDebug: PropTypes.bool,
};
