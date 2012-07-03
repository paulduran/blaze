/* adapted from http://stackoverflow.com/questions/7904522/knockout-content-editable-custom-binding */
ko.bindingHandlers.textValue = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        ko.utils.registerEventHandler(element, "keydown", function () {
            setTimeout(function () {
                var modelValue = valueAccessor();
                var elementValue = $(element).text();
                if (ko.isWriteableObservable(modelValue)) {
                    modelValue(elementValue);
                } else { //handle non-observable one-way binding
                    var allBindings = allBindingsAccessor();
                    if (allBindings._ko_property_writers && allBindings._ko_property_writers.textValue)
                        allBindings._ko_property_writers.textValue(elementValue);
                }
            }, 0);
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || "";
        if ($(element).text() !== value) {
            $(element).text(value);
        }
    }
};
