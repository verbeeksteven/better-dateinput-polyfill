/*!
 * better-dateinput-polyfill (https://github.com/chemerisuk/better-dateinput-polyfill)
 * input[type=date] polyfill for better-dom (https://github.com/chemerisuk/better-dom)
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 */
DOM.extend("input[type=date]", {
    after: "div[hidden].%CLASS%>p.%CLASS%-header+a.%CLASS%-prev+a.%CLASS%-next+table.%CLASS%-days>(thead>tr>th[data-i18n=calendar.weekday.$]*7)+tbody>(tr>td*7)*6".replace(/%CLASS%/g, "better-dateinput-calendar")
}, {
    constructor: function() {
        var input = this,
            calendar = input.next();

        input
            .set("type", "text") // remove legacy dateinput if it exists
            .on({
                click: function() {
                    this._syncDateWithCalendar(calendar);
                },
                keydown: function(e) {
                    this._handleDateInputKeys(e.get("keyCode"), e.get("altKey"), calendar);
                    
                    e.preventDefault(); // prevent default typing of characters, submit on enter etc.
                }
            });

        calendar.on("click", function(e) {
            input._handleCalendarClick(e.target, calendar);
            
            e.stopPropagation(); // stop bubbling to allow navigation via prev/next month buttons
            e.preventDefault(); // prevent focusing on the input if it's inside of the label
        });

        DOM.on("click", function() {
            if (!input.isFocused()) {
                calendar.hide();    
            }
        });

        this.setCalendarDate = (function() {
            var calendarCaption = calendar.find(".better-dateinput-calendar-header"),
                calendarDays = calendar.findAll("td");

            return function(value) {
                this._refreshCalendar(value, calendarCaption, calendarDays);

                return this;
            };
        })();

        // show calendar for autofocused elements
        if (this.isFocused()) {
            this.fire("focus");
        }
    },
    getCalendarDate: function() {
        return this.getData("calendarDate");
    },
    _syncDateWithCalendar: function(calendar) {
        var value = (this.get("value") || "").split("-");
        // switch calendar to the input value date
        this.setCalendarDate(value.length > 1 ? new Date( parseInt(value[0],10), parseInt(value[1],10) - 1, parseInt(value[2],10)) : new Date());

        calendar.show();
    },
    _syncDateWithInput: function(calendar) {
        var date = this.getCalendarDate(),
            zeroPadMonth = ("00" + (date.getMonth() + 1)).slice(-2),
            zeroPadDate = ("00" + date.getDate()).slice(-2);

        this.set(date.getFullYear() + "-" + zeroPadMonth + "-" + zeroPadDate);

        calendar.hide();
    },
    _handleDateInputKeys: function(key, altKey, calendar) {
        var delta = 0,
            currentDate = this.getCalendarDate();

        if (key === 13) { // show/hide calendar on enter key
            if (calendar.isHidden()) {
                this._syncDateWithCalendar(calendar);
            } else {
                this._syncDateWithInput(calendar);
            }
        } else if (key === 27 || key === 9) {
            calendar.hide(); // esc or tab key hides calendar
        } else if (key === 8 || key === 46) {
            this.set(""); // backspace or delete clears the value
        } else {
            if (key === 74 || key === 40) { delta = 7; }
            else if (key === 75 || key === 38) { delta = -7; }                            
            else if (key === 76 || key === 39) { delta = 1; }
            else if (key === 72 || key === 37) { delta = -1; }

            if (delta) {
                if (altKey) {
                    currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 1 : -1));
                } else {
                    currentDate.setDate(currentDate.getDate() + delta);
                }

                this.setCalendarDate(currentDate);
            }
        }
    },
    _handleCalendarClick: function(el, calendar) {
        var calendarDate = this.getCalendarDate(),
            currentYear = calendarDate.getFullYear(),
            currentMonth = calendarDate.getMonth(),
            currentDate = calendarDate.getDate();

        if (el.get("tagName") === "TD") {
            this.setCalendarDate(new Date(currentYear, currentMonth,
                el.parent().get("rowIndex") * 7 + el.get("cellIndex") - 5 - new Date(currentYear, currentMonth, 1).getDay()
            ));

            this._syncDateWithInput(calendar);
        } else if (el.hasClass("better-dateinput-calendar-prev")) {
            this.setCalendarDate(new Date(currentYear, currentMonth - 1, 1)).fire("focus");
        } else if (el.hasClass("better-dateinput-calendar-next")) {
            this.setCalendarDate(new Date(currentYear, currentMonth + 1, 1)).fire("focus");
        }
    },
    _refreshCalendar: function(value, calendarCaption, calendarDays) {
        var iterDate = new Date(value.getFullYear(), value.getMonth(), 0);
        // update caption
        calendarCaption.set("<span data-i18n='calendar.month." + value.getMonth() + "'> " + (isNaN(value.getFullYear()) ? "" : value.getFullYear()));
        
        if (!isNaN(iterDate.getTime())) {
            // move to begin of the start week
            iterDate.setDate(iterDate.getDate() - iterDate.getDay());
            
            calendarDays.each(function(day, index) {
                iterDate.setDate(iterDate.getDate() + 1);
                
                var mDiff = value.getMonth() - iterDate.getMonth(),
                    dDiff = value.getDate() - iterDate.getDate();

                if (value.getFullYear() !== iterDate.getFullYear()) {
                    mDiff *= -1;
                }

                day.set("className", mDiff ?
                    (mDiff > 0 ? "prev-calendar-day" : "next-calendar-day") :
                    (dDiff ? "calendar-day" : "current-calendar-day")
                );

                day.set(iterDate.getDate().toString());
            });

            // update current date
            this.setData("calendarDate", value);
        }
    }
});
