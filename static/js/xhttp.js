/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global getRole, createUserArray, returnHtml, addObserver, M */

// Declare globals required for xHttp requests and data handling
let recordPositions = [];
let userSearchPositions = {};
let quizSearchPositions = {};

/* Remove click listeners from a elements within results data */
/* Requires: */
/*  resultsDataElem: Results data container */
function stopListeningToResultsATags(resultsDataElem) {
    $(resultsDataElem).find('a').
        off('click');
}

/* Remove MaterializeCSS Tooltip instances from elements within results data */
/* Requires: */
/*  resultsDataElem: Results data container  */
function destroyResultsDataTooltips(resultsDataElem) {
    // (i declaration required by jQuery .each)
    $(resultsDataElem).find('.tooltipped').
        each((i, elem) => {
            let instance = M.Tooltip.getInstance(elem);
            if (instance) {
                instance.destroy();
            }
        });
}

/* Record the total pages and current page of results for a given result set */
/* Requires: */
/* obj: An object containing the record properties. */
/*      All records will contain: */
/*          totalPages: Total number of record pages */
/*          currentPage: The currently displayed page of results */
/*      Records will also contain one of the following properties: */
/*          role: User Account Role Members */
/*          userSearch: Username search string */
/*          quizSearch: Quiz title search string */
function addRecordPositions(obj) {
    let record;
    if ('role' in obj) { // User account role members
        record = recordPositions.find((record) => record.role === obj.role);

        /* If a record already exists for this role update the total and */
        /* current page property values */
        if (record) {
            if (obj.totalPages) {
                record.totalPages = obj.totalPages;
            }
            if (obj.currentPage) {
                record.currentPage = obj.currentPage;
            }
            return;
        }
        // Otherwise...
        if (!obj.currentPage) {
            // If the currentPage property is missing from obj, add it
            obj.currentPage = 1;
        }

        if (!obj.totalPages) {
            // If the totalPages property is missing from obj, add it
            obj.totalPages = 1;
        }
        // Add the obj to the recordPositions array as a new record
        recordPositions.push(obj);
    } else if ('userSearch' in obj) { // Username search string
        // Update the userSearchPositions properties
        userSearchPositions = {'userSearch': obj.userSearch};

        if ('totalPages' in obj) {
            userSearchPositions.totalPages = obj.totalPages;
        }

        if ('currentPage' in obj) {
            userSearchPositions.currentPage = obj.currentPage;
        }
    } else if ('quizSearch' in obj) { // Quiz title search string
        // Update the quizSearchPositions properties
        quizSearchPositions = {'quizSearch': obj.quizSearch};

        if ('totalPages' in obj) {
            quizSearchPositions.totalPages = obj.totalPages;
        }

        if ('currentPage' in obj) {
            quizSearchPositions.currentPage = obj.currentPage;
        }
    }
}

/* Return the properties of given record */
/* Requires: */
/*  key: An object to locate. The object has one of the following properties: */
/*      role: User Account Role Members */
/*      userSearch: Username search string */
/*      quizSearch: Quiz title search string */
/* Returns: */
/*  Record object with the following properties: */
/*      role/userSearch/quizSearch (as appropriate to the located object) */
/*      totalPages: Total number of record pages */
/*      currentPage: Currently displayed page of records */
function getRecordPosition(key) {
    let record;
    if ('role' in key) { // User account role members
        record = recordPositions.find((record) => record.role === key.role);
        if (record) {
            return {
                "role": record.role,
                "totalPages": record.totalPages,
                "currentPage": record.currentPage
            };
        }
    } else if ('userSearch' in key) { // Username search string
        return {
            "userSearch": userSearchPositions.userSearch,
            "totalPages": userSearchPositions.totalPages,
            "currentPage": userSearchPositions.currentPage
        };
    } else if ('quizSearch' in key) { // Quiz title search string
        return {
            "quizSearch": quizSearchPositions.quizSearch,
            "totalPages": quizSearchPositions.totalPages,
            "currentPage": quizSearchPositions.currentPage
        };
    }
}

/* Turn an xHttp request object into a formatted url string */
/* Requires: */
/*  requestObj: Request object with the following parameters: */
/*      type: Request type */
/*      params: Object with key:value pairs with which to build the request */
/* Returns: */
/*  Formatted url string */
function buildRequestString(requestObj) {
    // Declare request string with initial value equal to the request type
    let request = requestObj.type;

    // If the requestObj has a params property, begin to format the string...
    if ('params' in requestObj) {
        request += '?'; // Follow the type with a ?....
        // Iterate over the params object properties
        Object.keys(requestObj.params).forEach((key, idx) => {
            if (idx === 0) {
                // First property.  Append key=value to request string
                request += `${key}=${requestObj.params[key]}`;
            } else {
                // Subsequent properties.  Append &key=value to request string
                request += `&${key}=${requestObj.params[key]}`;
            }
        });
    }
    return request; // Return request string
}

/* Update enabled/disabled record controls, show total pages and current page */
/* Requires: */
/*  elem: Results data container element */
/*  key: Object with one of the following parameters: */
/*      role: User Account Role Members */
/*      userSearch: Username search string */
/*      quizSearch: Quiz title search string */
function updateRecordControls(elem, key) {
    // Get the .results-controls container element
    let rowControls = $(elem).prevAll('.results-control')[0];
    // Get the .results-control-first element
    let first = rowControls.firstElementChild;
    // Get the .results-control.prev element
    let prev = first.nextElementSibling;
    // Get the .pageNumber element
    let pageNumberInput = rowControls.querySelector('input.pageNumber');
    // Get the .totalPages element
    let totalPagesSpan = rowControls.querySelector('span.totalPages');
    // Get the .results-control-last element
    let last = rowControls.lastElementChild;
    // Get the .results-control-next element
    let next = last.previousElementSibling;

    let record;
    if ('role' in key) { // User account role members
        record = getRecordPosition({'role': key.role});
    } else if ('userSearch' in key) { // Username search string
        record = getRecordPosition({'userSearch': key.userSearch});
        if (!record) {
            return; // If no result, return
        }
    } else if ('quizSearch' in key) { // Quiz title search string
        record = getRecordPosition({'quizSearch': key.quizSearch});
        if (!record) {
            return; // If no result, return
        }
    }

    // Get the total page value
    let currentPage = record.currentPage;
    let totalPages = record.totalPages;

    if (totalPages > 0) { // If there are pages of results
        if (rowControls.classList.contains('hidden')) {
            // If the .results-control container is hidden, display it
            rowControls.classList.remove('hidden');
        }
    } else if (totalPages === 0 && !rowControls.classList.contains('hidden')) {
        // Otherwise, hide the .results-control container
        rowControls.classList.add('hidden');
    }

    // Display the currentPage value in the pageNumberInput element
    pageNumberInput.value = currentPage;

    /* If we have a record of the totalPages value, display it in the */
    /* totalPagesSpan element */
    if (totalPages !== undefined) {
        totalPagesSpan.innerHTML = totalPages;
    }

    if (Number(currentPage) === 1) { // First page of results
        // Grey out the First element
        first.firstElementChild.classList.add('grey-text');
        first.firstElementChild.classList.add('text-lighten-1');
        first.firstElementChild.classList.remove('light-blue-text');
        first.firstElementChild.classList.remove('text-darken-4');
        // Grey out the Prev element
        prev.firstElementChild.classList.add('grey-text');
        prev.firstElementChild.classList.add('text-lighten-1');
        prev.firstElementChild.classList.remove('light-blue-text');
        prev.firstElementChild.classList.remove('text-darken-4');
        if (totalPages > currentPage) { // If there are more pages...
            // Colourise the Next element
            next.firstElementChild.classList.add('light-blue-text');
            next.firstElementChild.classList.add('text-darken-4');
            next.firstElementChild.classList.remove('grey-text');
            next.firstElementChild.classList.remove('text-lighten-1');
            // Colourise the Last element
            last.firstElementChild.classList.add('light-blue-text');
            last.firstElementChild.classList.add('text-darken-4');
            last.firstElementChild.classList.remove('grey-text');
            last.firstElementChild.classList.remove('text-lighten-1');
        } else { // Otherwise there is only a single page of results
            // Grey out the Next element
            next.firstElementChild.classList.add('grey-text');
            next.firstElementChild.classList.add('text-lighten-1');
            next.firstElementChild.classList.remove('light-blue-text');
            next.firstElementChild.classList.remove('text-darken-4');
            // Grey out the Last element
            last.firstElementChild.classList.add('grey-text');
            last.firstElementChild.classList.add('text-lighten-1');
            last.firstElementChild.classList.remove('light-blue-text');
            last.firstElementChild.classList.remove('text-darken-4');
        }
    } else if (currentPage < totalPages) { // A page between 2 and penultimate
        // Colourise the First element
        first.firstElementChild.classList.add('light-blue-text');
        first.firstElementChild.classList.add('text-darken-4');
        first.firstElementChild.classList.remove('grey-text');
        first.firstElementChild.classList.remove('text-lighten-1');
        // Colourise the Prev element
        prev.firstElementChild.classList.add('light-blue-text');
        prev.firstElementChild.classList.add('text-darken-4');
        prev.firstElementChild.classList.remove('grey-text');
        prev.firstElementChild.classList.remove('text-lighten-1');
        // Colourise the Next element
        next.firstElementChild.classList.add('light-blue-text');
        next.firstElementChild.classList.add('text-darken-4');
        next.firstElementChild.classList.remove('grey-text');
        next.firstElementChild.classList.remove('text-lighten-1');
        // Colourise the Last element
        last.firstElementChild.classList.add('light-blue-text');
        last.firstElementChild.classList.add('text-darken-4');
        last.firstElementChild.classList.remove('grey-text');
        last.firstElementChild.classList.remove('text-lighten-1');
    } else if (currentPage === totalPages) { // The last page
        // Grey out the First element
        first.firstElementChild.classList.add('light-blue-text');
        first.firstElementChild.classList.add('text-darken-4');
        first.firstElementChild.classList.remove('grey-text');
        first.firstElementChild.classList.remove('text-lighten-1');
        // Grey out the Prev element
        prev.firstElementChild.classList.add('light-blue-text');
        prev.firstElementChild.classList.add('text-darken-4');
        prev.firstElementChild.classList.remove('grey-text');
        prev.firstElementChild.classList.remove('text-lighten-1');
        // Grey out the Next element
        next.firstElementChild.classList.add('grey-text');
        next.firstElementChild.classList.add('text-lighten-1');
        next.firstElementChild.classList.remove('light-blue-text');
        next.firstElementChild.classList.remove('text-darken-4');
        // Grey out the Last element
        last.firstElementChild.classList.add('grey-text');
        last.firstElementChild.classList.add('text-lighten-1');
        last.firstElementChild.classList.remove('light-blue-text');
        last.firstElementChild.classList.remove('text-darken-4');
    }
}

/* Render the results of an xHttp request as Html within a target element */
/* Requires: */
/*  elem: Container element to hold the rendered HTML */
/*  result: xHttp result object */
function xHttpRenderResult(elem, result) {

    /* Refresh the totals within MaterializeCSS Collapsible header elements */
    /* Requires: */
    /*  obj: xHttp result object totals property */
    const refreshCollapsibleHeaders = (obj) => {
        // Define role group headers element selector
        let rghSel = '.collapsible-role-groups > li > ';
        rghSel += 'div[data-role-group]:not(.collapsible-body)';

        // Get jQuery role group headers object
        let roleGroupHeaders = $(rghSel);

        // For each role group header...
        roleGroupHeaders.each((i) => {
            // Get the header element
            let header = roleGroupHeaders[i];

            // Get the target header text element
            let target = header.querySelector('.collapsible-header-text');

            // Get the role-group value
            let roleGroup = header.getAttribute('data-role-group');

            // Get the member count for the role group from obj.role_groups
            let memberCount;
            let rGroup = obj.role_groups.
                find((group) => group.role_group === roleGroup);
            if (rGroup !== undefined) {
                // If the role group is found, populate memberCount
                memberCount = rGroup.member_count;
            }

            // Set the header text
            target.innerHTML = `${roleGroup}`;

            // Set the member count
            target.nextElementSibling.innerHTML = `(${memberCount})`;
        });

        // Define user role headers element selector
        let urhSel = '.collapsible-user-roles > li > ';
        urhSel += 'div[data-role]:not(.collapsible-body)';

        // Get jQuery user role headers object
        let userRoleHeaders = $(urhSel);

        // For each user role header...
        userRoleHeaders.each((i) => {
            // Get the header element
            let header = userRoleHeaders[i];

            // Get the target header text element
            let target = header.querySelector('.collapsible-header-text');

            // Get the user role value
            let userRole = header.getAttribute('data-role');

            /* Get the role description, member count, total pages from */
            /* obj.user_roles */
            let userRoleDesc;
            let memberCount;
            let totalPages;
            let uRole = obj.user_roles.find((role) => role.role === userRole);
            if (uRole !== undefined) {
                // If the user role is found, populate variables
                userRoleDesc = uRole.role_desc;
                memberCount = uRole.member_count;
                totalPages = Math.ceil(memberCount / 10); // 10 records per page
                // Update record positions
                addRecordPositions({'role': userRole, totalPages});
            }

            // Set the header text
            target.innerHTML = `${userRoleDesc}`;

            // Set the member count
            target.nextElementSibling.innerHTML = `(${memberCount})`;
        });
    };

    /* Refresh record controls */
    const refreshRecordControls = () => {
        // Get jQuery user roles header object
        let headers = $('.collapsible-user-roles > li > div[data-role]');

        // For each header...
        headers.each((i) => {
            // Get the header
            let header = headers[i];
            // Get the user role value
            let key = {'role': header.getAttribute('data-role')};
            // Get the .results-data element for this role
            let elem = header.nextElementSibling.querySelector('.results-data');
            // update the record controls for this .results-data container
            updateRecordControls(elem, key);
        });
    };

    if (result.type === "globalQuizSearch" ||
            result.type === "myQuizSearch") { // Quiz search
        // Add record position and update record controls
        addRecordPositions(result.request);
        updateRecordControls(elem, {'quizSearch': result.request.quizSearch});
    } else if (result.type === "userSearch") { // User search
        // Add record position and update record controls
        addRecordPositions(result.request);
        updateRecordControls(elem, {'userSearch': result.request.userSearch});
        // Populate the userList global with result.user_data
        // eslint-disable-next-line no-unused-vars
        createUserArray(result.user_data);
    } else if (result.type === "getUsers") { // User role members
        // Add record position
        addRecordPositions(result.request);
        // Refresh role group and user role collapsible header text
        refreshCollapsibleHeaders(result.totals);
        // Refresh record controls
        refreshRecordControls();
        // Populate the userList global with result.user_data
        // eslint-disable-next-line no-unused-vars
        createUserArray(result.user_data);
    }

    // Set the target container innerHTML to result.html
    elem.innerHTML = result.html;
}

/* Render a MaterializeCSS Preloader within a target element */
/* Requires: */
/*  elem: Container element to hold the preloader */
function xHttpRenderPreloader(elem) {
    // Call returnHtml() to return the preloader html
    let request = 'preloader';
    let html = returnHtml({request});

    // Set the container element innerHTML to the preloader html
    elem.innerHTML = html;
}

/* Send new xHttp Request */
/* Requires: */
/*  requestObj: preformatted string, or object with the following */
/*              properties: */
/*                  type:   request type keyword */
/*                  params: key/value pairs for each property */
/* Optional: */
/*  elem: Container element in which to render the results */
function xHttpRequest(requestObj, elem) {
    // If elem is provided..
    if (elem) {
        // If elem is a .results-data container...
        if ($(elem).hasClass('results-data')) {

            /* Remove click listeners and MaterializeCSS Tooltip instances */
            /* from a elements within the container */
            stopListeningToResultsATags($(elem));
            destroyResultsDataTooltips($(elem));
        }
        // Render a preloader within the container
        xHttpRenderPreloader(elem);
    }

    // Create xHttp request
    let xhttp = new XMLHttpRequest();

    /* Turn the xHttp responseText into the properties of an object */
    const parseResult = (xHttpRequest, elem) => {
        let result;
        if (xHttpRequest.readyState === 4 &&
                xHttpRequest.status === 200) { // If we have a result...
            // Convert the response text into an object
            result = JSON.parse(xHttpRequest.responseText);
            // Call xHttpRenderResult()
            xHttpRenderResult(elem, result);
        }
    };

    // If requestObj is a String...
    let request;
    if (typeof requestObj === 'string') {
        request = requestObj; // Set request to requestObj
    } else {
        // Otherwise call buildRequestString()
        request = buildRequestString(requestObj);
    }

    // Open the xHttp request
    xhttp.open("GET", request, true);

    // If elem is provided...
    if (elem) {
        // When the ready state changes, call parseResult()
        xhttp.onreadystatechange = () => {
            parseResult(xhttp, elem);
        };
    }

    // Send the xHttp request
    xhttp.send();

    // If the request type is 'validate_quiz_title'...
    if (requestObj.type === 'validate_quiz_title') {
        return xhttp; // Return the xHttp object
    }
}

/* Get the provided page of results */
/* Requires: */
/*  elem: results data container element */
/*  key: Object with one of the following parameters: */
/*      role: User Account Role Members */
/*      userSearch: Username search string */
/*      quizSearch: Quiz title search string */
/*  currentPage: The results page number to retrieve */
function getRecordPage(elem, key, currentPage) {
    let addRecordObj;
    let request;
    if ('quizSearch' in key) { // Quiz title search
        // Format a record object
        addRecordObj = ({'quizSearch': key.quizSearch, currentPage});
        // Format an xHttp request object
        request = {
            'type':
                'myQuizSearch', // Current users quiz search
            'params': {
                'searchStr': key.quizSearch, // Quiz title to search
                'page': currentPage, // Results page to return
                'category': $('#quizCategory').val() // Quiz category filter
            }
        };
        // If the search button has data-type="global" this is a global search
        let isGlobal = $('.search-action-container button[data-type="global"]').
            attr('data-type');

        // If this is a global search, alter the request.type property
        if (isGlobal) {
            request.type = 'globalQuizSearch';
        }
    } else if ('userSearch' in key) { // Username search
        // Format a record object
        addRecordObj = ({'userSearch': key.userSearch, currentPage});
        // Format an xHttp request object
        request = {
            'type':
                'userSearch', // user search
            'params': {
                'searchStr': key.userSearch, // Username search string
                'page': currentPage // Results page to return
            }
        };
    } else if ('role' in key) { // User role members
        // Format a record object
        addRecordObj = ({'role': key.role, currentPage});
        // Format an xHttp request object
        request = {
            'type':
                'getUsers', // User role members
            'params': {
                'role': key.role, // User role filter
                'page': currentPage // Results page to return
            }
        };
    }
    // Add/update the record with the formatted record object
    addRecordPositions(addRecordObj);
    // Update the record controls for the provided results container
    updateRecordControls(elem, key);
    // Call xHttpRequest() to return the requested results page
    xHttpRequest(request, elem);
}

/* Reload the current page of results */
/* Requires: */
/*  elem: results data container element */
/*  key: Object with one of the following parameters: */
/*      role: User Account Role Members */
/*      userSearch: Username search string */
/*      quizSearch: Quiz title search string */
/*  currentPage: The results page number to retrieve */
// eslint-disable-next-line no-unused-vars
function getCurrentRecord(elem, key) {
    // Get the record position object
    let recordPosition = getRecordPosition(key);

    let totalPages;
    let currentPage;
    let request;
    if ('quizSearch' in key) { // Quiz title search
        // Format an xHttp request object
        request = {
            'type':
                'quizSearch', // Current users quiz search
            'params': {
                'searchStr': key.quizSearch, // Quiz title to search
                'page': quizSearchPositions.currentPage // Current page number
            }
        };
    } else if ('userSearch' in key) { // Username search
        // Format an xHttp request object
        request = {
            'type':
                'userSearch', // user search
            'params': {
                'searchStr': key.userSearch, // Username search string
                'page': userSearchPositions.currentPage // Current page number
            }
        };
    } else if ('role' in key) { // User role members
        //If there is a record for this role, get the values
        if (recordPosition) {
            totalPages = recordPosition.totalPages;
            currentPage = recordPosition.currentPage;
        } else { // Otherwise...
            // calculate totalPages, and currentPage is 1
            totalPages = Math.ceil((getRole(key.role).member_count) / 10);
            currentPage = 1;

            // Add the record
            addRecordPositions({'role': key.role, totalPages, currentPage});
        }
        // Format an xHttp request object
        request = {
            'type':
                'getUsers', // User role members
            'params': {
                'role': key.role, // User role filter
                'page': currentPage // Current page number
            }
        };
    }

    // Update the record controls for the provided results data container
    updateRecordControls(elem, key);

    // Call xHttpRequest() to return the current results page
    xHttpRequest(request, elem);
}

/* Reload the current page of results */
/* Requires: */
/*  elem: results data container element */
/*  key: Object with one of the following parameters: */
/*      role: User Account Role Members */
/*      userSearch: Username search string */
/*      quizSearch: Quiz title search string */
/*  currentPage: The results page number to retrieve */
function getSelectedRecord(elem, key, pageNum) {
    // Get the record position object
    let recordPosition = getRecordPosition(key);

    // Get the total number of record pages
    let totalPages = recordPosition.totalPages;

    // Get the requested page number
    let requestedPage = Math.ceil(Number(pageNum));


    let addRecordObj;
    let request;
    if ('quizSearch' in key) { // Quiz title search
        addRecordObj = ({'quizSearch': key.quizSearch, requestedPage});
        // Format an xHttp request object
        request = {
            'type':
                'myQuizSearch', // Current users quiz search
            'params': {
                'searchStr': key.quizSearch, // Quiz title to search
                'page': requestedPage, // Requested page number
                'category': $('#quizCategory').val() // Quiz category filter
            }
        };
        // If the search button has data-type="global" this is a global search
        let isGlobal = $('.search-action-container button[data-type="global"]').
            attr('data-type');

        // If this is a global search, alter the request.type property
        if (isGlobal) {
            request.type = 'globalQuizSearch';
        }
    } else if ('userSearch' in key) { // Username search
        // Format a record object
        addRecordObj = ({'userSearch': key.userSearch, requestedPage});
        // Format an xHttp request object
        request = {
            'type':
                'userSearch', // user search
            'params': {
                'searchStr': key.userSearch, // Username search string
                'page': requestedPage // Results page to return
            }
        };
    } else if ('role' in key) { // User role members
        // If there is no record for this role...
        if (!recordPosition) {
            // Calculate totalPages, and currentPage is 1
            totalPages = Math.ceil((getRole(key.role).member_count) / 10);
            requestedPage = 1;
        }
        // Format a record object
        addRecordObj = ({'role': key.role, totalPages, requestedPage});
        request = {
            'type':
                'getUsers', // User role members
            'params': {
                'role': key.role, // User role filter
                'page': requestedPage // Results page to return
            }
        };
    }
    // Add/update the record with the formatted record object
    addRecordPositions(addRecordObj);
    // Update the record controls for the provided results container
    updateRecordControls(elem, key);
    // Call xHttpRequest() to return the requested results page
    xHttpRequest(request, elem);
}

/* Add keyup, focusout listeners to pageNumberInput elements */
function listenToPageNumberInputs() {

    /* Determine results to return, and request data */
    /* Requires: */
    /*  self: pageNumberInput Element */
    const listenerAction = (self) => {
        // Get .results-control container
        let target = $(self).parent().
            nextAll('.results-data')[0];

        // Is this control for user search data?
        let isUserSearch = self.parentElement.parentElement.
                parentElement.classList.contains('user-search');

        // Determine the type of results data relating to the control
        let key;
        if (self.parentElement.parentElement.id === 'quizCollection') {
            // Quiz search, and quiz title search string
            key = {'quizSearch': quizSearchPositions.quizSearch};
        } else if (isUserSearch) {
            // User search, and username search string
            key = {'userSearch': userSearchPositions.userSearch};
        } else {
            // User role members, and user account role
            key = {'role': self.parentElement.parentElement.parentElement.
                previousElementSibling.getAttribute('data-role')};
        }

        // Get the total number of record pages
        let totalRecords = Number(self.nextElementSibling.
            nextElementSibling.innerHTML);

        // Get the page number from the pageNumberInput element value
        let pageNumber = Math.ceil(Number(self.value));

        // If pageNumber is NaN or zero length...
        if (isNaN(pageNumber) || self.value === "") {

            /* Set pageNumberInput element value to the currentPage for the */
            /* relevant request type, and return */
            self.value = getRecordPosition(key).currentPage;
            return;
        }

        // If the input number is greater than the total number of record pages
        if (pageNumber > totalRecords) {
            pageNumber = totalRecords; // pageNumber  = total record pages
        } else if (pageNumber < 1) { // If input number is less than 1
            pageNumber = 1; // pageNumber = 1
        }
        self.value = pageNumber; // pageNumberInput elem value = pageNumber
        // Call getSelectedRecord() to return results for the input page number
        getSelectedRecord(target, key, pageNumber);
    };

    /* Reset the pageNumberInput element value to it's previous value */
    /* Requires: */
    /*  self: pageNumberInput Element */
    const listenerReset = (self) => {
        // Is this control for user search data?
        let isUserSearch = self.parentElement.parentElement.
                parentElement.classList.contains('user-search');

        // Determine the type of results data relating to the control
        let key;
        if (self.parentElement.parentElement.id === 'quizCollection') {
            // Quiz search, and quiz title search string
            key = {'quizSearch': quizSearchPositions.quizSearch};
        } else if (isUserSearch) {
            // User search, and username search string
            key = {'userSearch': userSearchPositions.userSearch};
        } else {
            // User role members, and user account role
            key = {'role': self.parentElement.parentElement.parentElement.
            previousElementSibling.getAttribute('data-role')};
        }

        /* Set pageNumberInput element value to the currentPage for the */
        /* relevant request type */
        self.value = getRecordPosition(key).currentPage;
    };

    // Get jQuery Object of .pageNumber inputs
    let pageNumberInputs = $('.results-control input.pageNumber');

    // Add keyup listener to .pageNumber inputs
    pageNumberInputs.on('keyup', (e) => {
        if (e.key === "Enter") { // If enter is pressed...
            listenerAction(e.currentTarget); // Call listenerAction()
        } else if (e.key === "Escape") { // If escape is pressed...
            listenerReset(e.currentTarget); // Call listenerReset()
        }
    });

    // Add focusout listener to .pageNumber inputs to call listenerReset()
    pageNumberInputs.on('focusout', (e) => listenerReset(e.currentTarget));
}

/* Requires: */
/*  option: String. first, next, prev or last. */
/*  self: .results-controls-first/next/prev/last element */
function getRecord(option, self) {
    // If the results control is greyed out, return
    if (self.classList.contains("grey-text")) {
        return;
    }

    // Get the .results-data container
    let target = $(self).parent().
        nextAll('.results-data')[0];

    // Is this control for user search data?
    let isUserSearch = self.parentElement.parentElement.
            parentElement.classList.contains('user-search');

    // Determine the type of results data relating to the control
    let key;
    if (self.parentElement.parentElement.id === 'quizCollection') {
        // Quiz search, and quiz title search string
        key = {'quizSearch': quizSearchPositions.quizSearch};
    } else if (isUserSearch) {
        // User search, and username search string
        key = {'userSearch': userSearchPositions.userSearch};
    } else {
        // User role members, and user account role
        key = {'role': self.parentElement.parentElement.parentElement.
            previousElementSibling.getAttribute("data-role")};
    }

    // Get the record for the determined request type
    let record = getRecordPosition(key);
    let page;

    switch (option) {
    case 'first': // Get first record page
        page = 1; // page number = 1
        break;
    case 'prev': // Get previous page
        // If the current page number is greater than 1...
        if (record.currentPage > 1) {
            page = record.currentPage - 1; // page number = current - 1
        }
        break;
    case 'next': // Get the next page
        // If the current page number is less than the total number of pages...
        if (record.currentPage < record.totalPages) {
            page = record.currentPage + 1; // page number = current + 1
        }
        break;
    case 'last': // Get the last record page
        page = record.totalPages; // page number = total number of pages
        break;
    }

    // Call getRecordPage() to return the requested data
    getRecordPage(target, key, page);
}

/* Add click listener to .results-control a elements */
function listenToRecordControls() {
    $(".results-control a").on("click", (e) => {
        e.preventDefault(); // Prevent the default link click action

        // Friendly var for clicked element
        let self = e.currentTarget;

        // Test clicked element classes to determine getRecord option
        let option;
        if (self.classList.contains('results-control-first')) {
            option = 'first';
        } else if (self.classList.contains('results-control-prev')) {
            option = 'prev';
        } else if (self.classList.contains('results-control-next')) {
            option = 'next';
        } else if (self.classList.contains('results-control-last')) {
            option = 'last';
        }

        // Call getRecord()
        getRecord(option, self);
    });
}

/* Add observer to results data container to call a function when results */
/* data is loaded */
/* Requires: */
/*  elem: .results-data container element */
/*  callback: Callback function to execute when the results data is loaded */
// eslint-disable-next-line no-unused-vars
function observeResults(elem, callback) {

    /* Check for the existence of a preloader within the data container and */
    /* return if it exists, otherwise execute the callback function */
    const preloaderCheck = () => {
        if ($(elem).children('.preloader-container').length) {
            return;
        }
        callback();
    };

    // Create and start the observer
    addObserver(elem, preloaderCheck).observe(elem, {childList: true});
}

/* Document Ready Function */
$(function() {
    // Add click listeners to .results-controls- elements
    listenToRecordControls();
    // Add keyup, focusout listeners to .pageNumber input elements
    listenToPageNumberInputs();
});