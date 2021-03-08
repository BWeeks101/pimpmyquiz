/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global getRole, createUserArray, inputHelperLabel */

let recordPositions = [];
let userSearchPositions = {};
let userList;

function addRecordPositions(obj) {
    let record;
    if ('role' in obj) {
        record = recordPositions.find((record) => record.role === obj.role);
        if (record) {
            if (obj.totalPages) {
                record.totalPages = obj.totalPages;
            }
            if (obj.currentPage) {
                record.currentPage = obj.currentPage;
            }
            return;
        }
        if (!obj.currentPage) {
            obj.currentPage = 1;
        }

        if (!obj.totalPages) {
            obj.totalPages = 1;
        }
        recordPositions.push(obj);

    } else if ('search' in obj) {
        userSearchPositions = {'search': obj.search};

        if ('totalPages' in obj) {
            userSearchPositions.totalPages = obj.totalPages;
        }

        if ('currentPage' in obj) {
            userSearchPositions.currentPage = obj.currentPage;
        }
    }
}

function getRecordPosition(key) {
    let record;
    if ('role' in key) {
        record = recordPositions.find((record) => record.role === key.role);
        if (record) {
            return {
                "role": record.role,
                "totalPages": record.totalPages,
                "currentPage": record.currentPage
            };
        }
    } else if ('search' in key) {
        return {
            "search": userSearchPositions.search,
            "totalPages": userSearchPositions.totalPages,
            "currentPage": userSearchPositions.currentPage
        };
    }
}

function buildRequestString(requestObj) {
    let request = requestObj.type;
    if ('params' in requestObj) {
        request += '?';
        Object.keys(requestObj.params).forEach((key, idx) => {
            if (idx === 0) {
                request += `${key}=${requestObj.params[key]}`;
            } else {
                request += `&${key}=${requestObj.params[key]}`;
            }
        });
    }
    return request;
}

function updateRecordControls(elem, key) {
    let rowControls = elem.previousElementSibling;
    let first = rowControls.firstElementChild;
    let prev = first.nextElementSibling;
    let pageNumberInput = rowControls.querySelector('input.pageNumber');
    let totalPagesSpan = rowControls.querySelector('span.totalPages');
    let last = rowControls.lastElementChild;
    let next = last.previousElementSibling;
    let record;
    if ('role' in key) {
        record = getRecordPosition({'role': key.role});
    } else if ('search' in key) {
        record = getRecordPosition({'search': key.search});
        if (!record) {
            return;
        }
    }
    let currentPage = record.currentPage;
    let totalPages = record.totalPages;
    if (totalPages > 0) {
        if (rowControls.classList.contains('hidden')) {
            rowControls.classList.remove('hidden');
        }
    } else if (totalPages === 0 && !rowControls.classList.contains('hidden')) {
        rowControls.classList.add('hidden');
    }

    pageNumberInput.value = currentPage;
    if (totalPages !== undefined) {
        totalPagesSpan.innerHTML = totalPages;
    }

    if (Number(currentPage) === 1) {
        first.classList.add('grey-text');
        first.classList.add('text-lighten-1');
        prev.classList.add('grey-text');
        prev.classList.add('text-lighten-1');
        if (totalPages > currentPage) {
            next.classList.remove('grey-text');
            next.classList.remove('text-lighten-1');
            last.classList.remove('grey-text');
            last.classList.remove('text-lighten-1');
        } else {
            next.classList.add('grey-text');
            next.classList.add('text-lighten-1');
            last.classList.add('grey-text');
            last.classList.add('text-lighten-1');
        }
    } else if (currentPage < totalPages) {
        first.classList.remove('grey-text');
        first.classList.remove('text-lighten-1');
        prev.classList.remove('grey-text');
        prev.classList.remove('text-lighten-1');
        next.classList.remove('grey-text');
        next.classList.remove('text-lighten-1');
        last.classList.remove('grey-text');
        last.classList.remove('text-lighten-1');
    } else if (currentPage === totalPages) {
        first.classList.remove('grey-text');
        first.classList.remove('text-lighten-1');
        prev.classList.remove('grey-text');
        prev.classList.remove('text-lighten-1');
        next.classList.add('grey-text');
        next.classList.add('text-lighten-1');
        last.classList.add('grey-text');
        last.classList.add('text-lighten-1');
    }
}

function xHttpRenderResult(elem, result) {

    const refreshCollapsibleHeaders = (obj) => {
        let rghSel = '.collapsible-role-groups > ';
        rghSel += 'li > ';
        rghSel += 'div[data-role-group]:not(.collapsible-body)';
        let roleGroupHeaders = $(rghSel);
        roleGroupHeaders.each((i) => {
            let header = roleGroupHeaders[i];
            let target = header.querySelector('.collapsible-header-text');
            let roleGroup = header.getAttribute('data-role-group');
            let memberCount;
            let rGroup = obj.role_groups.
                find((group) => group.role_group === roleGroup);
            if (!rGroup === undefined) {
                memberCount = rGroup.member_count;
            }
            target.innerHTML = `${roleGroup}`;
            target.nextElementSibling.innerHTML = `(${memberCount})`;
        });

        let urhSel = '.collapsible-user-roles > ';
        urhSel += 'li > ';
        urhSel += 'div[data-role]:not(.collapsible-body)';
        let userRoleHeaders = $(urhSel);
        userRoleHeaders.each((i) => {
            let header = userRoleHeaders[i];
            let target = header.querySelector('.collapsible-header-text');
            let userRole = header.getAttribute('data-role');
            let userRoleDesc;
            let memberCount;
            let totalPages;
            let uRole = obj.user_roles.find((role) => role.role === userRole);
            if (!uRole === undefined) {
                userRoleDesc = uRole.role_desc;
                memberCount = uRole.member_count;
                totalPages = Math.ceil(memberCount / 10);
                addRecordPositions({'role': userRole, totalPages});
            }
            target.innerHTML = `${userRoleDesc}`;
            target.nextElementSibling.innerHTML = `(${memberCount})`;
        });
    };

    const refreshRecordControls = () => {
        let headerSelector = '.collapsible-user-roles > ';
        headerSelector += 'li > ';
        headerSelector += 'div[data-role]';
        let headers = $(headerSelector);
        headers.each((i) => {
            let header = headers[i];
            let key = {'role': header.getAttribute('data-role')};
            let elem = header.nextElementSibling.querySelector('.results-data');
            updateRecordControls(elem, key);
        });
    };

    let html = result.html;
    if (result.type === "userSearch") {
        addRecordPositions(result.request);
        updateRecordControls(elem, {'search': result.request.search});
    } else if (result.type === "getUsers") {
        addRecordPositions(result.request);
        refreshCollapsibleHeaders(result.totals);
        refreshRecordControls();
    }
    // eslint-disable-next-line no-unused-vars
    userList = createUserArray(result.user_data);
    elem.innerHTML = html;
}

function xHttpRenderPreloader(elem) {
    let html = '<div class="preloader-container">';
    html += '<div class="preloader-wrapper big active">';
    html += '<div class="spinner-layer">';
    html += '<div class="circle-clipper left">';
    html += '<div class="circle"></div>';
    html += '</div><div class="gap-patch">';
    html += '<div class="circle"></div>';
    html += '</div><div class="circle-clipper right">';
    html += '<div class="circle"></div></div></div></div></div>';
    elem.innerHTML = html;
}

function xHttpRequest(requestObj, elem) {
    if (elem) {
        xHttpRenderPreloader(elem);
    }
    let xhttp = new XMLHttpRequest();

    const parseResult = (self, elem) => {
        let result;
        if (self.readyState === 4 && self.status === 200) {
            result = JSON.parse(self.responseText);
            xHttpRenderResult(elem, result);
        }
    };

    let request;
    if (typeof requestObj === 'string') {
        request = requestObj;
    } else {
        request = buildRequestString(requestObj);
    }
    xhttp.open("GET", request, true);
    if (elem) {
        xhttp.onreadystatechange = () => {
            parseResult(xhttp, elem);
        };
    }
    xhttp.send();
}

function getRecordPage(elem, key, currentPage) {
    let addRecordObj;
    let request;
    if ('search' in key) {
        addRecordObj = ({'search': key.search, currentPage});
        request = {
            'type':
                'userSearch',
            'params': {
                'searchStr': key.search,
                'page': currentPage
            }
        };
    } else if ('role' in key) {
        addRecordObj = ({'role': key.role, currentPage});
        request = {
            'type':
                'getUsers',
            'params': {
                'role': key.role,
                'page': currentPage
            }
        };
    }
    addRecordPositions(addRecordObj);
    updateRecordControls(elem, key);
    xHttpRequest(request, elem);
}

function getCurrentRecord(elem, key) {
    let recordPosition = getRecordPosition(key);
    let totalPages;
    let currentPage;
    let request;
    if ('search' in key) {
        request = {
            'type':
                'userSearch',
            'params': {
                'searchStr': key.search,
                'page': userSearchPositions.currentPage
            }
        };
    } else if ('role' in key) {
        if (recordPosition) {
            totalPages = recordPosition.totalPages;
            currentPage = recordPosition.currentPage;
        } else {
            totalPages = Math.ceil((getRole(key.role).member_count) / 10);
            currentPage = 1;
        }
        addRecordPositions({'role': key.role, totalPages, currentPage});
        request = {
            'type':
                'getUsers',
            'params': {
                'role': key.role,
                'page': currentPage
            }
        };
    }
    updateRecordControls(elem, key);
    xHttpRequest(request, elem);
}

function getSelectedRecord(elem, key, pageNum) {
    let recordPosition = getRecordPosition(key);
    let totalPages = recordPosition.totalPages;
    let currentPage = Math.ceil(Number(pageNum));
    let request;
    if ('search' in key) {
        request = {
            'type':
                'userSearch',
            'params': {
                'searchStr': key.search,
                'page': currentPage
            }
        };
    } else if ('role' in key) {
        if (!recordPosition) {
            totalPages = Math.ceil((getRole(key.role).member_count) / 10);
            currentPage = 1;
        }
        addRecordPositions({'role': key.role, totalPages, currentPage});
        request = {
            'type':
            'getUsers',
            'params': {
                'role': key.role,
                'page': currentPage
            }
        };
    }
    updateRecordControls(elem, key);
    xHttpRequest(request, elem);
}

function getSearchResults(self) {
    let value = self.parentElement.previousElementSibling.
         firstElementChild.querySelector('input').value;
    if (value === "" || value === undefined || value.len < 2) {
        return;
    }
    let request = {
        'type':
            'userSearch',
        'params': {
            'searchStr': value,
            'page': 1
        }
    };
    addRecordPositions({
        'search': request.params.searchStr,
        'currentPage': 1
    });
    xHttpRequest(request, $('#userSearchResults')[0]);
}

function listenToUserRoleCollapsibleHeaders() {
    $(".collapsible-user-roles .collapsible-header[data-role]").
        on("click", (e) => {
            let self = e.currentTarget;
            let selector = ".collapsible .results-data";
            let target = self.nextElementSibling.querySelector(selector);
            let key;
            if (!self.parentElement.classList.contains("active")) {
                key = {'role': self.getAttribute("data-role")};
                getCurrentRecord(target, key);
            }
        });
}

function listenToUserSearchCollapsibleHeaders() {
    $(".collapsible-search .collapsible-header").on("click", (e) => {
        let self = e.currentTarget;
        let selector = ".collapsible .results-data";
        let target = self.nextElementSibling.querySelector(selector);
        let key = {'search': getRecordPosition({'search': ''}).search};
        if (key.search) {
            if (!self.parentElement.classList.contains("active")) {
                getCurrentRecord(target, key);
            }
        }
    });
}

function listenToPageNumberInputs() {
    const listenerAction = (self) => {
        let target = self.parentElement.nextElementSibling;
        let isSearch = self.parentElement.parentElement.
            parentElement.classList.contains('user-search');
        let key;
        if (isSearch) {
            key = {'search': userSearchPositions.search};
        } else {
            key = {'role': self.parentElement.parentElement.parentElement.
                previousElementSibling.getAttribute('data-role')};
        }
        let totalRecords = Number(self.nextElementSibling.
            nextElementSibling.innerHTML);
        let pageNumber = Math.ceil(Number(self.value));
        if (isNaN(pageNumber) || self.value === "") {
            self.value = getRecordPosition(key).currentPage;
            return;
        }

        if (pageNumber > totalRecords) {
            pageNumber = totalRecords;
        } else if (pageNumber < 1) {
            pageNumber = 1;
        }

        self.value = pageNumber;
        getSelectedRecord(target, key, pageNumber);
    };

    const listenerReset = (self) => {
        let isSearch = self.parentElement.parentElement.
            parentElement.classList.contains('user-search');
        let key;
        if (isSearch) {
            key = {'search': userSearchPositions.search};
        } else {
            key = {'role': self.parentElement.parentElement.parentElement.
            previousElementSibling.getAttribute('data-role')};
        }
        self.value = getRecordPosition(key).currentPage;
    };

    let pageNumberInputs = $('.results-control input.pageNumber');

    pageNumberInputs.on('keyup', (e) => {
        if (e.key === "Enter") {
            listenerAction(e.currentTarget);
        } else if (e.key === "Escape") {
            listenerReset(e.currentTarget);
        }
    });
    pageNumberInputs.on('focusout', (e) => listenerReset(e.currentTarget));
}

function getRecord(option, self) {
    if (self.classList.contains("grey-text")) {
        return;
    }
    let target = self.parentElement.nextElementSibling;
    let isSearch = self.parentElement.parentElement.
        parentElement.classList.contains('user-search');
    let key;
    if (isSearch) {
        key = {'search': userSearchPositions.search};
    } else {
        key = {'role': self.parentElement.parentElement.parentElement.
            previousElementSibling.getAttribute("data-role")};
    }
    let record = getRecordPosition(key);
    let page;

    switch (option) {
    case 'first':
        page = 1;
        break;
    case 'prev':
        if (record.currentPage > 1) {
            page = record.currentPage - 1;
        }
        break;
    case 'next':
        if (record.currentPage < record.totalPages) {
            page = record.currentPage + 1;
        }
        break;
    case 'last':
        page = record.totalPages;
        break;
    }
    getRecordPage(target, key, page);
}

function listenToRecordControls() {
    $(".results-control a").on("click", (e) => {
        e.preventDefault();
        let self = e.currentTarget;
        let record;

        if (self.classList.contains('results-control-first')) {
            record = 'first';
        } else if (self.classList.contains('results-control-prev')) {
            record = 'prev';
        } else if (self.classList.contains('results-control-next')) {
            record = 'next';
        } else if (self.classList.contains('results-control-last')) {
            record = 'last';
        }

        getRecord(record, self);
    });
}

function searchCreateListeners() {
    $("#userSearch").on("focusout", () => inputHelperLabel("userSearch"));

    $("#userSearch").on("keyup", (e) => {
        if (e.key === "Enter") {
            inputHelperLabel("userSearch");
            getSearchResults($('#userSearch')[0].parentElement.parentElement.
                 nextElementSibling.firstElementChild);
        }
    });

    $("#searchButton").
        on("click", () => getSearchResults($("#searchButton")[0]));
}

listenToRecordControls();
searchCreateListeners();
listenToUserRoleCollapsibleHeaders();
listenToUserSearchCollapsibleHeaders();
listenToPageNumberInputs();