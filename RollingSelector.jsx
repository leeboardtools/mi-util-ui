import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from './Popup';
import * as EU from '../util/ElementUtils';

/**
 * A React component that pops up a rolling list for selection.
 * The rolling list displays a fixed number of items with the middle
 * item the 'selected' item. The items in the list are presumed to
 * either eventually wrap around or to go on continuously.
 * When the list is displayed, an item may be chosen from the list
 * with the mouse/pointer, or the list may be scrolled using either
 * the keyboard or the wheel, changing the selected item in the middle
 * of the list.
 */
export class RollingSelector extends React.Component {
    constructor(props) {
        super(props);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onBlurItemList = this.onBlurItemList.bind(this);
        this.hideList = this.hideList.bind(this);

        this._outerRef = React.createRef();
        this._itemListRef = React.createRef();
        this._mainRef = React.createRef();

        const { items } = props;

        this.state = {
            isListShown: false,
            selectedItemIndex: Math.floor(items.length / 2),
        };
    }


    componentDidUpdate(prevProps, prevState) {
        const { items } = this.props;
        if (prevProps.items.length !== items.length) {
            this.setState({
                selectedItemIndex: Math.floor(items.length / 2),
            });
        }

        if (this.state.isListShown !== prevState.isListShown) {
            // Gotta update who actually has focus if one of us has focus.
            if (this._outerRef.current
             && this._outerRef.current.contains(document.activeElement)) {
                this.focus();
            }
        }
    }


    focus() {
        if (this.state.isListShown) {
            // Gotta focus to the item list...
            if (EU.setFocus(this._itemListRef.current)) {
                return;
            }
        }

        EU.setFocus(this._mainRef.current);
    }


    showList() {
        this.setState({
            isListShown: true,
        });
    }

    hideList() {
        this.setState({
            isListShown: false,
        });
    }


    rollItems(delta) {
        const { onRollItems, items } = this.props;
        if (onRollItems) {
            onRollItems(delta, this.state.selectedItemIndex, items);
        }
    }


    onKeyDown(e) {
        if (this.props.disabled) {
            return;
        }

        const { isListShown, selectedItemIndex } = this.state;
        const { items } = this.props;
        switch (e.key) {
        case ' ' :
            if (isListShown) {
                this.hideList();
            }
            else {
                this.showList();
            }
            e.preventDefault();
            e.stopPropagation();        
            break;
        
        case 'ArrowUp':
            this.rollItems(-1);
            e.preventDefault();
            e.stopPropagation();        
            break;
        
        case 'ArrowDown':
            this.rollItems(1);
            e.preventDefault();
            e.stopPropagation();        
            break;
            
        case 'PageUp':
            if (e.ctrlKey) {
                this.rollItems(-items.length + 1);
            }
            else {
                this.rollItems(-selectedItemIndex);
            }
            e.preventDefault();
            e.stopPropagation();        
            break;
        
        case 'PageDown':
            if (e.ctrlKey) {
                this.rollItems(items.length - 1);
            }
            else {
                this.rollItems(items.length - selectedItemIndex - 1);
            }
            e.preventDefault();
            e.stopPropagation();        
            break;
        
        case 'Enter':
            this.hideList();
            e.preventDefault();
            e.stopPropagation();        
            break;

        case 'Escape':
            this.rollItems();
            this.hideList();
            e.preventDefault();
            e.stopPropagation();        
            break;
        }
    }


    onWheel(e) {
        if (this.props.disabled) {
            return;
        }

        const { selectedItemIndex } = this.state;
        const { items } = this.props;

        if (e.deltaY > 0) {
            if (e.ctrlKey) {
                this.rollItems(items.length - selectedItemIndex - 1);
            }
            else {
                this.rollItems(1);
            }
            e.stopPropagation();        
        }
        else if (e.deltaY < 0) {
            if (e.ctrlKey) {
                this.rollItems(-selectedItemIndex);
            }
            else {
                this.rollItems(-1);
            }
            e.stopPropagation();        
        }
    }


    onClick(e) {
        if (this.state.isListShown) {
            this.hideList();
        }
        else {
            this.showList();
        }
    }


    onBlur(e) {
        if (e.relatedTarget && this._outerRef.current) {
            if (this._outerRef.current.contains(e.relatedTarget)) {
                return;
            }
        }

        const { onBlur } = this.props;
        if (onBlur) {
            onBlur(e);
        }
    }


    onBlurItemList(e) {
        this.hideList();
    }


    renderMain() {
        const { ariaLabel, inputClassExtras, size, items, tabIndex } = this.props;
        const divClassName = 'Input-group Mb-0 ';
        const className = 'RollingSelector-main ' 
            + (inputClassExtras || '');
        
        let value;
        const selectedItem = items[this.state.selectedItemIndex];
        if (selectedItem) {
            value = selectedItem.mainText || selectedItem.text || selectedItem.value.toString();
        }
    
        return <div className = {divClassName}
            aria-label = {ariaLabel}
            onKeyDown = {this.onKeyDown}
            onClick = {this.onClick}
            onWheel = {this.onWheel}
            //onBlur = {this.onBlur}
            //onFocus = {() => console.log('main onFocus')}
            tabIndex = {tabIndex}
            ref = {this._mainRef}
        >
            <span className = {className}
                size = {size}
            >
                {value}
            </span>
        </div>;
    }


    renderItem(item, rollAmount, style) {
        const { value } = item;
        const key = value.toString();
        const text = item.text || key;

        let className = 'RollingSelector-item ';
        if (style) {
            className += style;
        }

        return <div
            key = {key}
            className = {className}
            onClick = {() => this.rollItems(rollAmount)}
        >
            {text}
        </div>;
    }


    renderItems() {
        const { props, state } = this;
        const { items } = props;
        const { selectedItemIndex } = state;

        const itemComponents = [];
        for (let i = 0; i < selectedItemIndex; ++i) {
            itemComponents.push(this.renderItem(items[i], i - selectedItemIndex));
        }
        if (selectedItemIndex >= 0) {
            itemComponents.push(this.renderItem(items[selectedItemIndex], 0, 'selected'));

            for (let i = selectedItemIndex + 1; i < items.length; ++i) {
                itemComponents.push(this.renderItem(items[i], i - selectedItemIndex));
            }
        }

        return <div
            key = "itemsList"
            className = "RollingSelector-itemList"
            onKeyDown = {this.onKeyDown}
            onBlur = {this.onBlurItemList}
            tabIndex = {0}
            onClick = {this.onClick}
            onWheel = {this.onWheel}
            ref = {this._itemListRef}
        >
            {itemComponents}
        </div>;

    }


    render() {
        const { classExtras, disabled, onFocus } = this.props;
        const { isListShown } = this.state;

        let className = 'RollingSelector ';
        if (classExtras) {
            className += classExtras;
        }

        const mainComponent = this.renderMain();
        const itemsComponent = this.renderItems();

        const popupComponent = <Popup
            show = {isListShown && !disabled}
            onClose = {this.hideList}
        >
            {itemsComponent}
        </Popup>;

        return <div className = {className}
            onFocus = {onFocus}
            onBlur = {this.onBlur}
            ref = {this._outerRef}
        >
            {mainComponent}
            {popupComponent}
        </div>;
    }
}


/**
 * Callback called whenever a new item is to be selected. 
 * @callback {RollingSelector~onRollItems}
 * @param {number|undefined} delta <code>undefined</code> is passed to indicate abort the
 * current selection (i.e. the Esc has been pressed)
 * @param {number} selectedItemIndex    The index in items of the currently selected item,
 * this is Math.floor(items.length / 2).
 * @param {DropdownSelector~Item[]} items
 */

/**
 * @typedef {object} RollingSelector~Item
 * @property {string} value
 * @property {string} [text] The text to be displayed in the item list.
 * @property {string} [mainText] Optional text to be displayed in the main display if the
 * item is the middle item, otherwise text will be displayed.
 */

/**
 * @typedef {object} RollingSelector~propTypes
 * @property {string} [id]
 * @property {string} [ariaLabel]
 * @property {string} [classExtras]
 * @property {string} [inputClassExtras]
 * @property {RollingSelector~Item[]} items This should normally contain an odd number
 * of items, as the middle item (Math.floor(items.length / 2)) is the selected item.
 * @property {RollingSelector~onRollItems} [onRollItems]
 * @property {number} [size]
 * @property {boolean}  [disabled]  If <code>true</code> the editor is disabled.
 * @property {number} [tabIndex]
 */
RollingSelector.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    classExtras: PropTypes.string,
    inputClassExtras: PropTypes.string,
    items: PropTypes.array.isRequired,
    //areItemsBefore: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    //areItemsAfter: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    onRollItems: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    size: PropTypes.number,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    tabIndex: PropTypes.number,
};
