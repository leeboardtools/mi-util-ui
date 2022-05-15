import React from 'react';
import PropTypes from 'prop-types';
import * as DP from '../util/DatePart';
import { getDatePartFormatter } from '../util/DatePartFormatter';
import { Popup } from './Popup';
import { getCalendarInfo } from '../util/CalendarInfo';


class DatePartSelector extends React.Component {
    constructor(props) {
        super(props);

        
        this.weeksDisplayed = 6;

        this.containerRef = React.createRef();

        this.state = {};
        this.updateFromDatePartChange(this.state);
    }


    componentDidUpdate(prevProps, prevState) {
        const stateUpdates = {};
        if (!DP.areDatePartsEquivalent(prevProps.datePart, this.props.datePart)) {
            this.updateFromDatePartChange(stateUpdates);
        }

        if (Object.values(stateUpdates).length) {
            this.setState(stateUpdates);
        }
    }


    contains(element) {
        const { current } = this.containerRef;
        if (current) {
            return current.contains(element);
        }
    }


    handleMouseEvent(e, type) {
        const { onMouseEvent } = this.props;
        if (onMouseEvent) {
            onMouseEvent(e, type);
        }
    }


    updateFromDatePartChange(stateUpdates) {
        const datePart = this.props.datePart || DP.datePartFromDate(new Date());
        stateUpdates.displayedYear = datePart.year;
        stateUpdates.displayedMonth = datePart.month;
    }


    chooseDatePart(datePart, keepOpen) {
        const { onChoose } = this.props;
        if (onChoose) {
            onChoose(datePart, keepOpen);
        }
    }


    renderMonthSelector() {
        const calendarInfo = this.props.calendarInfo || getCalendarInfo();
        const { monthNames } = calendarInfo.longNames;

        return <div className = "DatePartSelector-monthSelector">
            <a className = "DatePartSelector-leftArrow DatePartSelector-monthArrow"
                onClick={() => this.chooseDatePart(DP.addMonths(this.props.datePart, -1), true)}
            >&lt;</a>
            <span className = "DatePartSelector-monthValue">
                {monthNames[this.state.displayedMonth]}
            </span>
            <a className = "DatePartSelector-rightArrow DatePartSelector-monthArrow"
                onClick={() => this.chooseDatePart(DP.addMonths(this.props.datePart, 1), true)}
            >&gt;</a>
        </div>;
    }

    renderYearSelector() {
        return <div className = "DatePartSelector-yearSelector">
            <a className = "DatePartSelector-leftArrow DatePartSelector-yearArrow"
                onClick={() => this.chooseDatePart(DP.addYears(this.props.datePart, -1), true)}
            >&lt;</a>
            <span className = "DatePartSelector-yearValue">
                {this.state.displayedYear}
            </span>
            <a className = "DatePartSelector-rightArrow DatePartSelector-yearArrow"
                onClick={() => this.chooseDatePart(DP.addYears(this.props.datePart, 1), true)}
            >&gt;</a>
        </div>;
    }

    renderHeader() {
        const monthSelector = this.renderMonthSelector();
        const yearSelector = this.renderYearSelector();
        return <div 
            className = "DatePartSelector-header">
            {monthSelector}
            {yearSelector}
        </div>;
    }

    renderFooter() {
        const todayDatePart = DP.datePartFromDate(new Date());
        const todayButton = <a
            className = "DatePartSelector-todayButton"
            onClick = {() => this.chooseDatePart(todayDatePart)}
        >
            {this.props.todayText || 'Today'}
        </a>;

        return <div className = "DatePartSelector-footer">
            {todayButton}
        </div>;
    }


    renderCalendarCell(value, style, key, datePart) {
        let className = 'DatePartSelector-cell ';
        if (style) {
            className += style;
        }

        let onClick;
        if (datePart) {
            onClick = () => this.chooseDatePart(datePart);
        }

        return <div
            key = {key}
            className = {className}
            onClick = {onClick}
        >
            {value}
        </div>;
    }

    renderRow(row, key, style) {
        let className = 'DatePartSelector-row ';
        if (style) {
            className += style;
        }
        return <div 
            key = {key}
            className = {className}>
            {row}
        </div>;
    }

    renderCalendar() {
        const { state, props } = this;
        const todayDatePart = DP.datePartFromDate(new Date());
        const currentDatePart = props.datePart || todayDatePart;

        let datePart = DP.getClosestSundayOnOrBefore({ 
            year: state.displayedYear, 
            month: state.displayedMonth,
            dayOfMonth: 1,
        });

        const rows = [];
        const row = [];

        const calendarInfo = props.calendarInfo || getCalendarInfo();
        const { weekdayNames } = calendarInfo.narrowNames;
        for (let j = 0; j < 7; ++j) {
            row[j] = this.renderCalendarCell(weekdayNames[j], 'dow', j);
        }
        rows.push(this.renderRow(row, -1, 'DatePartSelector-dowRow'));

        for (let i = 0; i < this.weeksDisplayed; ++i) {
            const row = [];
            for (let j = 0; j < 7; ++j) {
                let style = 'date';
                if (DP.areDatePartsIdentical(datePart, todayDatePart)) {
                    // Today...
                    style += ' today';
                }
                else if (DP.areDatePartsIdentical(datePart, currentDatePart)) {
                    // Current
                    style += ' selected';
                }
                if (datePart.month !== currentDatePart.month) {
                    style += ' otherMonth';
                }

                row[j] = this.renderCalendarCell(
                    datePart.dayOfMonth, style, i + '_' + j, datePart);

                datePart = DP.addDays(datePart, 1);
            }

            rows.push(this.renderRow(row, 'Row_' + i));
        }

        return <div
            key = "calendar"
            className = "DatePartSelector-calendar"
        >
            {rows}
        </div>;
    }

    render() {
        const { props } = this;
        const { classExtras } = props;
        let className = 'DatePartSelector ';
        if (classExtras) {
            className += classExtras;
        }

        return <div className = {className}
            ref = {this.containerRef}
            onMouseDown = {(e) => this.handleMouseEvent(e, 'onMouseDown')}
            onMouseMove = {(e) => this.handleMouseEvent(e, 'onMouseMove')}
            onMouseUp = {(e) => this.handleMouseEvent(e, 'onMouseUp')}
            onPointerDown = {(e) => this.handleMouseEvent(e, 'onMouseDown')}
            onPointerMove = {(e) => this.handleMouseEvent(e, 'onMouseMove')}
            onPointerUp = {(e) => this.handleMouseEvent(e, 'onMouseUp')}
            onWheel = {props.onWheel}
        >
            {this.renderHeader()}
            {this.renderCalendar()}
            {this.renderFooter()}
        </div>;
    }
}

DatePartSelector.propTypes = {
    datePart: PropTypes.object,
    classExtras: PropTypes.string,
    calendarInfo: PropTypes.object,
    onChoose: PropTypes.func,
    onMouseEvent: PropTypes.func,
    todayText: PropTypes.string,
    onWheel: PropTypes.func,
};


/**
 * React component for editing a {@link DatePart}, supports a calendar popup
 * for selecting the date.
 */
export class DatePartEditor extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onDatePartChosen = this.onDatePartChosen.bind(this);
        this.onSelectorMouseEvent = this.onSelectorMouseEvent.bind(this);

        this.hideDateSelector = this.hideDateSelector.bind(this);

        this.editRef = React.createRef();
        this.selectorRef = React.createRef();

        this.state = {
        };

        // Not using state because there's no need to re-render until we decide to
        // change the date.
        this.wheelX = 0;
        this.wheelY = 0;

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

        if (!DP.areDatePartsIdentical(prevProps.value, this.props.value)) {
            this.updateFromValue(stateUpdates);
        }

        if (Object.values(stateUpdates).length) {
            this.setState(stateUpdates);
        }

        this.isDateSelectorActive = false;

        this.wheelX = 0;
        this.wheelY = 0;
    }


    updateLocale(stateUpdates) {
        const { locale } = this.props;
        stateUpdates.calendarInfo = getCalendarInfo(locale);
        this.defDatePartFormatter = getDatePartFormatter(locale);
    }


    updateFromValue(stateUpdates) {
        const { props } = this;
        const datePartFormatter = props.datePartFormatter || this.defDatePartFormatter;
        stateUpdates.editText = datePartFormatter.format(props.value) || '';
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

        const { isDateSelectorShown } = this.state;

        switch (e.key) {
        case '+':
        case '=':
            this.addDays(1);
            e.preventDefault();
            e.stopPropagation();        
            break;
            
        case '_':
        case '-':
            this.addDays(-1);
            e.preventDefault();
            e.stopPropagation();        
            break;

        case 'ArrowLeft':
            if (isDateSelectorShown) {
                this.addDays(-1);
                e.preventDefault();
                e.stopPropagation();        
            }
            break;

        case 'ArrowRight':
            if (isDateSelectorShown) {
                this.addDays(1);
                e.preventDefault();
                e.stopPropagation();        
            }
            break;

        case 'ArrowUp':
            // Previous week/day
            this.addDays((isDateSelectorShown) ? -7 : -1);
            e.preventDefault();
            e.stopPropagation();        
            break;

        case 'ArrowDown':
            // Next week/day
            this.addDays((isDateSelectorShown) ? 7 : 1);
            e.preventDefault();
            e.stopPropagation();        
            break;

        case 'PageUp':
            if (e.ctrlKey) {
                // Previous month
                this.addMonths(-1);
            }
            else if (e.shiftKey) {
                // Previous year
                this.addYears(-1);
            }
            else {
                // Previous week
                this.addDays(-7);
            }
            e.preventDefault();
            e.stopPropagation();        
            break;

        case 'PageDown':
            if (e.ctrlKey) {
                // Next month
                this.addMonths(1);
            }
            else if (e.shiftKey) {
                // Next year
                this.addYears(1);
            }
            else {
                // Next week
                this.addDays(7);
            }
            e.preventDefault();
            e.stopPropagation();        
            break;
        
        case 'Escape' :
            if (isDateSelectorShown) {
                this.hideDateSelector();
                e.preventDefault();
                e.stopPropagation();        
            }
            break;
        
        case 'Enter' :
            if (isDateSelectorShown) {
                this.leaveEditor();
                e.preventDefault();
                e.stopPropagation();        
            }
            break;
        
        case ' ' :
            if (!isDateSelectorShown) {
                this.showDateSelector();
            }
            else {
                this.hideDateSelector();
            }
            e.preventDefault();
            e.stopPropagation();        
            break;
        }
    }


    onWheel(e) {
        const { isDateSelectorShown } = this.state;
        if (this.props.disabled || !isDateSelectorShown) {
            return;
        }

        if (e.deltaX) {
            if (e.deltaX * this.wheelX < 0) {
                this.wheelX = 0;
            }
            this.wheelX += e.deltaX;
            this.wheelY = 0;
            e.stopPropagation();
        }
        else if (e.deltaY) {
            this.wheelX = 0;
            if (e.deltaY * this.wheelY < 0) {
                this.wheelY = 0;
            }
            this.wheelY += e.deltaY;
            e.stopPropagation();
        }
        else {
            return;
        }

        const tolerance = 10;

        if (this.wheelX < -tolerance) {
            this.addDays(1);
        }
        else if (this.wheelX > tolerance) {
            this.addDays(-1);
        }
        else if (this.wheelY < -tolerance) {
            if (e.ctrlKey) {
                this.addMonths(1);
            }
            else {
                this.addDays(7);
            }
        }
        else if (this.wheelY > tolerance) {
            if (e.ctrlKey) {
                this.addMonths(-1);
            }
            else {
                this.addDays(-7);
            }
        }
        else {
            return;
        }

        this.wheelX = this.wheelY = 0;
    }


    addDays(deltaDays) {
        const { onChange } = this.props;
        if (onChange) {
            const datePart = DP.addDays(this.props.value, deltaDays);
            onChange(datePart);
        }
    }


    addMonths(deltaMonths) {
        const { onChange } = this.props;
        if (onChange) {
            const datePart = DP.addMonths(this.props.value, deltaMonths);
            onChange(datePart);
        }
    }


    addYears(deltaYears) {
        const { onChange } = this.props;
        if (onChange) {
            const datePart = DP.addYears(this.props.value, deltaYears);
            onChange(datePart);
        }
    }


    showDateSelector() {
        if (!this.props.disabled) {
            this.setState({
                isDateSelectorShown: true,
            });
        }
    }


    hideDateSelector() {
        this.setState({
            isDateSelectorShown: false,
        });
    }


    onFocus(e) {
        const { onFocus } = this.props;
        if (onFocus) {
            onFocus(e);
        }
    }


    leaveEditor() {
        this.hideDateSelector();

        const { props, state } = this;
        const datePartFormatter = props.datePartFormatter || this.defDatePartFormatter;
        const newDatePart = datePartFormatter.parse(state.editText, { defDatePart: props.value, });

        if (!DP.areDatePartsIdentical(newDatePart, props.value)
         && (typeof newDatePart === 'object')) {
            const { onChange } = props;
            if (onChange) {
                onChange(newDatePart);
            }
        }
    }


    onBlur(e) {
        if (this.isDateSelectorActive) {
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

        this.leaveEditor();
    }


    onClick(e) {
        // If enabled, toggle the calendar...
        if (!this.props.disabled) {
            if (this.state.isDateSelectorShown) {
                this.hideDateSelector();
            }
            else {
                this.showDateSelector();
            }
        }
    }


    onDatePartChosen(datePart, keepOpen) {
        if (!keepOpen) {
            this.hideDateSelector();
        }

        const { onChange } = this.props;
        if (onChange) {
            onChange(datePart);
        }

        const editRef = this.props.innerRef || this.editRef;
        if (editRef.current) {
            editRef.current.focus();
        }
    }


    onSelectorMouseEvent(e, type) {
        switch (type) {
        case 'onMouseDown':
            this.isDateSelectorActive = true;
            break;
        
        case 'onMouseUp' :
            this.isDateSelectorActive = false;
            break;
        }
    }


    renderTextEditor() {
        const { props, state } = this;
        const { inputClassExtras, } = props;
        let { placeholder } = props;

        let className = 'DatePartEditor';
        if (inputClassExtras) {
            className += ' ' + inputClassExtras;
        }

        if (typeof placeholder === 'object') {
            const datePartFormatter = props.datePartFormatter || this.defDatePartFormatter;
            placeholder = datePartFormatter.format(placeholder);
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

    
    renderDateSelector() {
        const { props, state } = this;
        const { isDateSelectorShown } = this.state;

        let { value, placeholder, disabled } = props;
        if (!value && (typeof placeholder === 'object')) {
            value = placeholder;
        }

        const dateSelectorComponent = <DatePartSelector
            datePart = {value}
            classExtras = {props.calendarClassExtras}
            calendarInfo = {state.calendarInfo}
            onChoose = {this.onDatePartChosen}
            onMouseEvent = {this.onSelectorMouseEvent}
            onWheel = {this.onWheel}
            todayText = {props.todayText}
            ref = {this.selectorRef}
        />;

        return <Popup
            show = {isDateSelectorShown && !disabled}
            onClose = {this.hideDateSelector}
        >
            {dateSelectorComponent}
        </Popup>;
    }

    render() {
        const textComponent = this.renderTextEditor();
        const calendarComponent = this.renderDateSelector();
        return <React.Fragment>
            {textComponent}
            {calendarComponent}
        </React.Fragment>;
    }
}



/**
 * @callback DatePartEditor~onChange
 * @param {DatePart} datePart
 */


/**
 * @typedef {object} DatePartEditor~propTypes
 * @property {string} [id]
 * @property {string} [ariaLabel]
 * @property {DatePart} [value]
 * @property {string|DatePart} [placeholder]
 * @property {string} [inputClassExtras]
 * @property {string} [calendarClassExtras]
 * @property {number} [size]
 * @property {DatePartEditor~onChange} [onChange]
 * @property {function} [onFocus]
 * @property {boolean|number} [disabled]
 * @property {DatePartFormatter} [datePartFormatter] The date formatter takes precedence
 * over the locale.
 * @property {string} [locale]
 * @property {number} [tabIndex]
 * @property {React.ref} [innerRef]
 * @property {string} [todayText] If specified a 'Today' button appears in the popup calender.
 */
DatePartEditor.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    value: PropTypes.object,
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    inputClassExtras: PropTypes.string,
    calendarClassExtras: PropTypes.string,
    size: PropTypes.number,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    datePartFormatter: PropTypes.object,
    locale: PropTypes.string,
    tabIndex: PropTypes.number,
    innerRef: PropTypes.any,
    todayText: PropTypes.string,
};