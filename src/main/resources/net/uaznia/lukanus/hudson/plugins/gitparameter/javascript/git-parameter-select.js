// send async request to the given URL (which will send back serialized ListBoxModel object),
// then use the result to fill the list box.
function gitParameterUpdateSelect(listBox, url, divId, config) {
    config = config || {};
    config = object(config);
    var originalOnSuccess = config.onSuccess;
    var l = $(listBox);
    // TODO - Remove '.firstChild?.nextSibling' once this plugin targets https://github.com/jenkinsci/jenkins/pull/6460 or higher
    var status = findFollowingTR(listBox, "validation-error-area").firstChild?.nextSibling || findFollowingTR(listBox, "validation-error-area");
    if (status.firstChild && status.firstChild.getAttribute('data-select-ajax-error')) {
        status.innerHTML = "";
    }
    config.onSuccess = function (rsp) {
        l.removeClassName("select-ajax-pending");
        var currentSelection = l.value;

        // clear the contents
        while (l.length > 0) l.options[0] = null;

        var selectionSet = false; // is the selection forced by the server?
        var possibleIndex = null; // if there's a new option that matches the current value, remember its index
        var opts = eval('(' + rsp.responseText + ')').values;
        for (var i = 0; i < opts.length; i++) {
            l.options[i] = new Option(opts[i].name, opts[i].value);
            if (opts[i].selected) {
                l.selectedIndex = i;
                selectionSet = true;
            }
            if (opts[i].value === currentSelection)
                possibleIndex = i;
        }

        // if no value is explicitly selected by the server, try to select the same value
        if (!selectionSet && possibleIndex != null)
            l.selectedIndex = possibleIndex;

        if (originalOnSuccess !== undefined)
            originalOnSuccess(rsp);

        var errors = eval('(' + rsp.responseText + ')').errors
        let error_div = $("git_parameter_errors_" + divId);
        if (errors.length !== 0) {
            error_div.show();
            error_div.addClassName("error");
            let $error_ul = $("git_parameter_errors_ul_" + divId);
            var lis = "";
            for (var j = 0; j < errors.length; j++) {
                lis += "<li>" + escapeHTML(errors[j]) + "</li>"
            }
            $error_ul.update(lis);
        }
        else {
            error_div.hide()
        }

    };
    config.onFailure = function (rsp) {
        l.removeClassName("select-ajax-pending");
        status.innerHTML = rsp.responseText;
        if (status.firstChild) {
            status.firstChild.setAttribute('data-select-ajax-error', 'true')
        }
        Behaviour.applySubtree(status);
        // deleting values can result in the data loss, so let's not do that unless instructed
        var header = rsp.getResponseHeader('X-Jenkins-Select-Error');
        if (header && "clear" === header.toLowerCase()) {
            // clear the contents
            while (l.length > 0) l.options[0] = null;
        }

    };

    l.addClassName("select-ajax-pending");
    new Ajax.Request(url, config);
}

Behaviour.specify("SELECT.gitParameterSelect", 'gitParameterSelect', 1000, function (e) {

    function hasChanged(selectEl, originalValue) {
        // seems like a race condition allows this to fire before the 'selectEl' is defined. If that happens, exit..
        if (!selectEl || !selectEl.options || !selectEl.options.length > 0)
            return false;
        var firstValue = selectEl.options[0].value;
        var selectedValue = selectEl.value;
        if (originalValue === "" && selectedValue === firstValue) {
            // There was no value pre-selected but after the call to updateListBox the first value is selected by
            // default. This must not be considered a change.
            return false;
        } else {
            return originalValue !== selectedValue;
        }
    }

    // controls that this SELECT box depends on
    refillOnChange(e, function (params) {
        var value = e.value;
        gitParameterUpdateSelect(e, e.getAttribute("fillUrl"), e.getAttribute("divId"), {
            parameters: params,
            onSuccess: function () {
                if (value == "") {
                    // reflect the initial value. if the control depends on several other SELECT.select,
                    // it may take several updates before we get the right items, which is why all these precautions.
                    var v = e.getAttribute("value");
                    if (v) {
                        e.value = v;
                        if (e.value == v) e.removeAttribute("value"); // we were able to apply our initial value
                    }
                }

                fireEvent(e, "filled"); // let other interested parties know that the items have changed

                // if the update changed the current selection, others listening to this control needs to be notified.
                if (hasChanged(e, value)) {
                    fireEvent(e, "change");
                }
            }
        });
    });
});

function escapeHTML(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
}