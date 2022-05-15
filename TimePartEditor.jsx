import React from 'react';
import PropTypes from 'prop-types';
import * as TP from '../util/TimePart';
import { Popup } from './Popup';
import { getTimePartFormatter } from '../util/TimePartFormatter';


class TimePartSelector extends React.Component {
    constructor(props) {
        super(props);

        this.minutesInterval = 15;
        this.rowsBefore = 4;

        this.state = {};
        this.updateFromTimePartChange(this.state);
    }


    componentDidUpdate(prevProps, prevState) {
        const stateUpdates = {};
        if (!TP.areTimePartsEquivalent(prevProps.timePart, this.props.timePart)) {
            this.updateFromTimePartChange(stateUpdates);
        }

        if (Object.values(stateUpdates).length) {
            this.setState(stateUpdates);
        }
    }


    handleMouseEvent(e, type) {
        const { onMouseEvent } = this.props;
        if (onMouseEvent) {
            onMouseEvent(e, type);
        }
    }


    updateFromTimePartChange(stateUpdates) {
        const timePart = this.props.timePart || TP.timePartFromDate(new Date());

        const centeredTimePart = Object.assign({}, timePart);
        centeredTimePart.minutes 
            = Math.floor(Math.floor(centeredTimePart.minutes / this.minutesInterval) 
                * this.minutesInterval);

        stateUpdates.centeredTimePart = centeredTimePart;
    }


    chooseTimePart(timePart, keepOpen) {
        const { onChoose } = this.props;
        if (onChoose) {
            onChoose(timePart, keepOpen);
        }
    }


    doLineUpDownTimePart(delta) {
        delta = (delta > 0) ? 1 : -1;
        const new_ms = TP.timePartTo_ms(this.state.centeredTimePart)
            + delta * this.minutesInterval * TP.MILLISECONDS_PER_MINUTE;
        const newTimePart = TP.timePartFrom_ms(new_ms, TP.MILLISECONDS_PER_DAY);
        this.chooseTimePart(newTimePart, true);
    }


    doPageUpDownTimePart(delta) {
        delta = (delta > 0) ? 1 : -1;

        const new_ms = TP.timePartTo_ms(this.state.centeredTimePart)
            + delta * this.rowsBefore * this.minutesInterval * TP.MILLISECONDS_PER_MINUTE;
        const newTimePart = TP.timePartFrom_ms(new_ms, TP.MILLISECONDS_PER_DAY);
        this.chooseTimePart(newTimePart, true);
    }

    
    doHourUpDownTimePart(delta) {
        delta = (delta > 0) ? 1 : -1;

        let hours = this.state.centeredTimePart.hours + delta;
        if (hours < 0) {
            hours = 23;
        }
        else if (hours > 23) {
            hours = 0;
        }
        const newTimePart = {
            hours: hours,
            minutes: 0,
            seconds: 0,
        };
        this.chooseTimePart(newTimePart, true);
    }


    renderHeader() {
        const { allDayText } = this.props;
        if (!allDayText) {
            return;
        }

        let className = 'TimePartSelector-allDayButton';
        if (!this.props.timePart) {
            className += ' checked';
        }

        const allDayButton = <a
            className = {className}
            onClick = {() => this.chooseTimePart()}
        >
            {allDayText}
        </a>;

        return <div className = "TimePartSelector-header">
            {allDayButton}
        </div>;
    }


    renderFooter() {

    }


    renderTimeItem(value, style, key, timePart) {
        let className = 'TimePartSelector-timeItem ';
        if (style) {
            className += style;
        }

        return <div
            key = {key}
            className = {className}
            onClick = {() => this.chooseTimePart(timePart)}
        >
            {value}
        </div>;
    }


    renderTimeList() {
        const { props } = this;
        const { timePartFormatter } = props;

        const rows = [];

        // We want the 'centered' time part, which is the time part on the
        // minutesInterval that is closest to the current time part.
        // We then back up rowsBefore * minutesInterval from that time, that
        // is our first row.
        // Add rowsBefore rows
        // Add the centered time part, selected if it matches props.timePart
        // Add rowsBefore rows after.

        const { centeredTimePart } = this.state;
        const centered_ms = TP.timePartTo_ms(centeredTimePart);

        const ms_perRow = this.minutesInterval * TP.MILLISECONDS_PER_MINUTE;
        let row_ms = centered_ms - this.rowsBefore * ms_perRow;

        for (let i = 0; i < this.rowsBefore; ++i) {
            const rowTimePart = TP.timePartFrom_ms(row_ms, TP.MILLISECONDS_PER_DAY);
            const text = (timePartFormatter) 
                ? timePartFormatter.format(rowTimePart) : TP.timePartToString(rowTimePart);
            rows.push(this.renderTimeItem(text, undefined, rows.length,
                Object.assign({}, rowTimePart)
            ));

            row_ms += ms_perRow;
        }

        let style;
        if (TP.areTimePartsIdentical(centeredTimePart, props.timePart)) {
            style = 'selected';
        }
        else {
            style = 'centerItem';
        }
        const text = (timePartFormatter) 
            ? timePartFormatter.format(centeredTimePart) : TP.timePartToString(centeredTimePart);
        rows.push(this.renderTimeItem(text, style, rows.length,
            centeredTimePart
        ));

        row_ms += ms_perRow;

        for (let i = 0; i < this.rowsBefore; ++i) {
            const rowTimePart = TP.timePartFrom_ms(row_ms, TP.MILLISECONDS_PER_DAY);
            const text = (timePartFormatter) 
                ? timePartFormatter.format(rowTimePart) : TP.timePartToString(rowTimePart);
            rows.push(this.renderTimeItem(text, undefined, rows.length,
                Object.assign({}, rowTimePart)
            ));

            row_ms += ms_perRow;
        }

        return <div
            key = "timeList"
            className = "TimePartSelector-timeList"
        >
            {rows}
        </div>;
    }


    render() {
        const { props } = this;
        const { classExtras } = props;
        let className = 'TimePartSelector ';
        if (classExtras) {
            className += classExtras;
        }

        return <div className = {className}
            onMouseDown = {(e) => this.handleMouseEvent(e, 'onMouseDown')}
            onMouseMove = {(e) => this.handleMouseEvent(e, 'onMouseMove')}
            onMouseUp = {(e) => this.handleMouseEvent(e, 'onMouseUp')}
            onPointerDown = {(e) => this.handleMouseEvent(e, 'onMouseDown')}
            onPointerMove = {(e) => this.handleMouseEvent(e, 'onMouseMove')}
            onPointerUp = {(e) => this.handleMouseEvent(e, 'onMouseUp')}
            onWheel = {props.onWheel}
        >
            {this.renderHeader()}
            {this.renderTimeList()}
            {this.renderFooter()}
        </div>;
    }
}

TimePartSelector.propTypes = {
    timePart: PropTypes.object,
    classExtras: PropTypes.string,
    onChoose: PropTypes.func,
    onMouseEvent: PropTypes.func,
    onWheel: PropTypes.func,
    timePartFormatter: PropTypes.object,
    allDayText: PropTypes.string,
};


/**
 * React component for editing {@link TimePart}s.
 */
export class TimePartEditor extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onTimePartChosen = this.onTimePartChosen.bind(this);
        this.onSelectorMouseEvent = this.onSelectorMouseEvent.bind(this);

        this.hideTimeSelector = this.hideTimeSelector.bind(this);

        this.editRef = React.createRef();
        this.selectorRef = React.createRef();

        //this.isTest = true;

        this.state = {
        };

        this.updateLocale(this.state);
        this.updateFromValue(this.state);
    }


    componentDidMount() {
    }


    componentDidUpdate(prevProps, prevState) {
        const stateUpdates = {};
        if (prevProps.locale !== this.props.locale) {
            this.updateLocale(stateUpdates);
        }

        if (!TP.areTimePartsIdentical(prevProps.value, this.props.value)) {
            this.updateFromValue(stateUpdates);
        }

        if (Object.values(stateUpdates).length) {
            this.setState(stateUpdates);
        }

        this.isTimeSelectorActive = false;
    }


    updateLocale(stateUpdates) {
        const { locale } = this.props;
        this.defTimePartFormatter = getTimePartFormatter(locale);
    }


    updateFromValue(stateUpdates) {
        const { props } = this;
        const timePartFormatter = props.timePartFormatter || this.defTimePartFormatter;
        stateUpdates.editText = timePartFormatter.format(props.value) || '';
    }


    onChange(e) {
        this.setState({
            editText: e.target.value,
        });
    }


    onKeyDown(e) {
        if (this.props.disabled) {
            return;
        }

        const selector = this.selectorRef.current;
        const { isTimeSelectorShown } = this.state;

        switch (e.key) {
        case '+':
        case '=':
            break;
            
        case '_':
        case '-':
            break;

        case 'ArrowLeft':
            break;

        case 'ArrowRight':
            break;

        case 'ArrowUp':
            if (isTimeSelectorShown && selector) {
                if (e.ctrlKey) {
                    selector.doHourUpDownTimePart(-1);
                }
                else {
                    selector.doLineUpDownTimePart(-1);
                }
                e.preventDefault();
                e.stopPropagation();        
            }
            break;

        case 'ArrowDown':
            if (isTimeSelectorShown && selector) {
                if (e.ctrlKey) {
                    selector.doHourUpDownTimePart(1);
                }
                else {
                    selector.doLineUpDownTimePart(1);
                }
                e.preventDefault();
                e.stopPropagation();        
            }
            break;

        case 'PageUp':
            if (isTimeSelectorShown && selector) {
                selector.doPageUpDownTimePart(-1);
                e.preventDefault();
                e.stopPropagation();        
            }
            break;

        case 'PageDown':
            if (isTimeSelectorShown && selector) {
                selector.doPageUpDownTimePart(1);
                e.preventDefault();
                e.stopPropagation();        
            }
            break;
        
        case 'Escape' :
            if (isTimeSelectorShown) {
                this.hideTimeSelector();
                e.preventDefault();
                e.stopPropagation();        
            }
            break;
        
        case 'Enter' :
            if (isTimeSelectorShown) {
                this.leaveEditor();
                e.preventDefault();
                e.stopPropagation();        
            }
            break;
        
        case ' ' :
            if (!isTimeSelectorShown) {
                this.showTimeSelector();
            }
            else {
                this.hideTimeSelector();
            }
            e.preventDefault();
            e.stopPropagation();        
            break;
        }
    }


    onWheel(e) {
        if (this.props.disabled) {
            return;
        }

        const selector = this.selectorRef.current;
        const { isTimeSelectorShown } = this.state;
        if (!selector || !isTimeSelectorShown) {
            return;
        }

        if (e.deltaY > 0) {
            if (e.ctrlKey) {
                selector.doHourUpDownTimePart(1);
            }
            else {
                selector.doLineUpDownTimePart(1);
            }
            e.stopPropagation();        
        }
        else if (e.deltaY < 0) {
            if (e.ctrlKey) {
                selector.doHourUpDownTimePart(-1);
            }
            else {
                selector.doLineUpDownTimePart(-1);
            }
            e.stopPropagation();        
        }
    }


    showTimeSelector() {
        if (!this.props.disabled) {
            this.setState({
                isTimeSelectorShown: true,
            });
        }
    }


    hideTimeSelector() {
        this.setState({
            isTimeSelectorShown: false,
        });
    }


    onFocus(e) {
        const { onFocus } = this.props;
        if (onFocus) {
            onFocus(e);
        }
    }


    leaveEditor() {
        this.hideTimeSelector();

        const { props, state } = this;
        const timePartFormatter = props.timePartFormatter || this.defTimePartFormatter;
        let newTimePart = timePartFormatter.parse(state.editText, { defTimePart: props.value, });
        if (newTimePart === 'string-undefined') {
            newTimePart = undefined;
        }

        if ((typeof newTimePart !== 'string')
         && !TP.areTimePartsIdentical(newTimePart, props.value)) {
            const { onChange } = props;
            if (onChange) {
                onChange(newTimePart);
            }
        }
    }


    onBlur(e) {
        if (this.isTimeSelectorActive) {
            // If this is true then there's a mouse down in the date selector. Haven't
            // been able to stop the mouse events in the date selector from propagating up
            // calling e.stopPropagation() on the mouse down event doesn't do it.
            // So without this when there is a click in the date selector there's a mouse
            // down, which gets to our parent and triggers a focus change.
            // We get this blur before the mouse up and corresponding click events are
            // generated in the date selector.
            // If we hide the date selector now those events never make it to the date
            // selector.
            return;
        }

        if (this.isTest) {
            return;
        }

        this.leaveEditor();
    }


    onClick(e) {
        // If enabled, toggle the calendar...
        if (!this.props.disabled) {
            if (this.state.isTimeSelectorShown) {
                this.hideTimeSelector();
            }
            else {
                this.showTimeSelector();
            }
        }
    }


    onTimePartChosen(timePart, keepOpen) {
        if (!keepOpen) {
            this.hideTimeSelector();
        }

        const { onChange } = this.props;
        if (onChange) {
            onChange(timePart);
        }

        const editRef = this.props.innerRef || this.editRef;
        if (editRef.current) {
            editRef.current.focus();
        }
    }


    onSelectorMouseEvent(e, type) {
        switch (type) {
        case 'onMouseDown':
            this.isTimeSelectorActive = true;
            break;
        
        case 'onMouseUp' :
            this.isTimeSelectorActive = false;
            break;
        }
    }


    renderTextEditor() {
        const { props, state } = this;
        const { inputClassExtras, } = props;
        let { placeholder } = props;

        const timePartFormatter = props.timePartFormatter || this.defTimePartFormatter;
        if (!state.editText && (typeof placeholder === 'object')) {
            placeholder = timePartFormatter.format(placeholder);
        }

        let className = 'TimePartEditor';
        if (inputClassExtras) {
            className += ' ' + inputClassExtras;
        }

        const editRef = props.innerRef || this.editRef;

        return <input type = "text"
            id = {props.id}
            className = {className}
            aria-label = {props.ariaLabel}
            placeholder = {placeholder}
            value = {state.editText}
            size = {props.size}
            disabled = {props.disabled}
            onChange = {this.onChange}
            onFocus = {this.onFocus}
            onBlur = {this.onBlur}
            onKeyDown = {this.onKeyDown}
            onClick = {this.onClick}
            ref = {editRef}
        />;
    }

    
    renderTimeSelector() {
        const { props, } = this;
        const { isTimeSelectorShown, disabled } = this.state;

        const timePartFormatter = props.timePartFormatter || this.defTimePartFormatter;

        let { value, placeholder } = props;
        if (!value && (typeof placeholder === 'object')) {
            value = placeholder;
        }

        const dateSelectorComponent = <TimePartSelector
            timePart = {value}
            classExtras = {props.selectorClassExtras}
            onChoose = {this.onTimePartChosen}
            onMouseEvent = {this.onSelectorMouseEvent}
            onWheel = {this.onWheel}
            timePartFormatter = {timePartFormatter}
            allDayText = {props.allDayText}
            ref = {this.selectorRef}
        />;

        return <Popup
            show = {isTimeSelectorShown && !disabled}
            onClose = {this.hideTimeSelector}
        >
            {dateSelectorComponent}
        </Popup>;
    }

    render() {
        const textComponent = this.renderTextEditor();
        const calendarComponent = this.renderTimeSelector();
        return <React.Fragment>
            {textComponent}
            {calendarComponent}
        </React.Fragment>;
    }
}


/**
 * @callback TimePartEditor~onChange
 * @param {TimePart} timePart
 */


/**
 * @typedef {object} TimePartEditor~propTypes
 * @property {string} [id]
 * @property {string} [ariaLabel]
 * @property {TimePart} [value]
 * @property {string|TimePart} [placeholder]
 * @property {string} [inputClassExtras]
 * @property {string} [selectorClassExtras]
 * @property {number} [size]
 * @property {TimePartEditor~onChange} [onChange]
 * @property {function} [onFocus]
 * @property {boolean|number} [disabled]
 * @property {TimePartFormatter} [timePartFormatter] The time formatter takes precedence
 * over the locale.
 * @property {string} [locale]
 * @property {number} [tabIndex]
 * @property {React.ref} [innerRef]
 * @property {string} [allDayText] If specified an All Day option appears at
 * the top of the popup selector. All day is represented by the time part being <code>undefined</code>.
 */
TimePartEditor.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    value: PropTypes.object,
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    inputClassExtras: PropTypes.string,
    selectorClassExtras: PropTypes.string,
    size: PropTypes.number,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    timePartFormatter: PropTypes.object,
    locale: PropTypes.string,
    tabIndex: PropTypes.number,
    innerRef: PropTypes.any,
    allDayText: PropTypes.string,
};