/* global getRole, createUserArray */

let recordPositions = [];
let userList;

function addRecordPositions(obj) {
    if (obj.role) {
        let result;
        recordPositions.forEach(function (record) {
            record = record.obj;
            if (record.role === obj.role) {
                if (obj.totalPages) {
                    record.totalPages = obj.totalPages;
                }
                if (obj.currentPage) {
                    record.currentPage = obj.currentPage;
                }
                result = true;
                return true;
            }
        });
        if (!result) {
            if (!obj.currentPage) {
                obj.currentPage = 1;
            }

            if (!obj.totalPages) {
                obj.totalPages = 1;
            }
            recordPositions.push({obj});
        }
    }
}

function getRecordPosition(role) {
    let result = false;
    recordPositions.forEach(function (record) {
        record = record.obj;
        if (record.role !== role) {
            return;
        }
        result = {"role": record.role,
            "totalPages": record.totalPages,
            "currentPage": record.currentPage};
    });
    return result;
}

function buildRequestString(requestObj) {
    let request = requestObj.type;
    let keys;
    if (requestObj.params) {
        request += '?';
        keys = Object.keys(requestObj.params);
        keys.forEach(function (key, idx) {
            if (idx === 0) {
                request += `${key}=${requestObj.params[key]}`;
            } else {
                request += `&${key}=${requestObj.params[key]}`;
            }
        });
    }
    return request;
}

function updateRecordControls(elem, role) {
    let rowControls = elem.previousElementSibling;
    let first = rowControls.firstElementChild;
    let prev = first.nextElementSibling;
    let pageNumberInput = rowControls.querySelector('input.pageNumber');
    let totalPagesSpan = rowControls.querySelector('span.totalPages');
    let next = rowControls.lastElementChild;
    let last = next.previousElementSibling;
    let record = getRecordPosition(role);
    let currentPage = record.currentPage;
    let totalPages = record.totalPages;

    pageNumberInput.value = currentPage;
    totalPagesSpan.innerHTML = totalPages;

    if (Number(currentPage) === 1) {
        first.classList.add('grey-text');
        first.classList.add('text-lighten-1');
        prev.classList.add('grey-text');
        prev.classList.add('text-lighten-1');
        next.classList.remove('grey-text');
        next.classList.remove('text-lighten-1');
        last.classList.remove('grey-text');
        last.classList.remove('text-lighten-1');
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

    function refreshCollapsibleHeaders(obj) {
        let i;
        let rghSel = '.collapsible-role-groups > ';
        rghSel += 'li > ';
        rghSel += 'div[data-role-group]:not(.collapsible-body)';
        let roleGroupHeaders = $(rghSel);
        i = 0;
        roleGroupHeaders.each(function () {
            let header = roleGroupHeaders[i];
            let target = header.querySelector('.collapsible-header-text');
            let roleGroup = header.getAttribute('data-role-group');
            let memberCount;
            obj.role_groups.forEach(function (rGroup) {
                if (rGroup.role_group !== roleGroup) {
                    return;
                }
                memberCount = rGroup.member_count;
            });
            target.innerHTML = `${roleGroup} (<span>${memberCount}</span>)`;
            i += 1;
        });

        let urhSel = '.collapsible-user-roles > ';
        urhSel += 'li > ';
        urhSel += 'div[data-role]:not(.collapsible-body)';
        let userRoleHeaders = $(urhSel);
        i = 0;
        userRoleHeaders.each(function () {
            let header = userRoleHeaders[i];
            let target = header.querySelector('.collapsible-header-text');
            let userRole = header.getAttribute('data-role');
            let userRoleDesc;
            let memberCount;
            let totalPages;
            obj.user_roles.forEach(function (uRole) {
                if (uRole.role !== userRole) {
                    return;
                }
                userRoleDesc = uRole.role_desc;
                memberCount = uRole.member_count;
                totalPages = Math.ceil(memberCount / 10);
                addRecordPositions({'role': userRole, totalPages});
            });
            target.innerHTML = `${userRoleDesc} (<span>${memberCount}</span>)`;
            i += 1;
        });
    }

    function refreshRecordControls() {
        let headerSelector = '.collapsible-user-roles > ';
        headerSelector += 'li > ';
        headerSelector += 'div[data-role]';
        let headers = $(headerSelector);
        let i = 0;
        headers.each(function () {
            let header = headers[i];
            let role = header.getAttribute('data-role');
            let elem = header.nextElementSibling.querySelector('.results-data');
            updateRecordControls(elem, role);
            i += 1;
        });
    }

    addRecordPositions(result.request);
    refreshCollapsibleHeaders(result.totals);
    refreshRecordControls();
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

    function parseResult(self, elem) {
        let result;
        if (self.readyState === 4 && self.status === 200) {
            result = JSON.parse(self.responseText);
            xHttpRenderResult(elem, result);
        }
    }

    let request;
    if (typeof requestObj === 'string') {
        request = requestObj;
    } else {
        request = buildRequestString(requestObj);
    }
    xhttp.open("GET", request, true);
    if (elem) {
        xhttp.onreadystatechange = function () {
            parseResult(xhttp, elem);
        };
    }
    xhttp.send();
}

function getFirstRecord(elem, role) {
    let currentPage = 1;
    addRecordPositions({role, currentPage});
    let request = {
        'type':
            'getUsers',
        'params':
            {'page': currentPage, role}
    };
    updateRecordControls(elem, role);
    xHttpRequest(request, elem);
}

// eslint-disable-next-line no-unused-vars
function getLastRecord(elem, role) {
    let totalPages = getRecordPosition(role).totalPages;
    let currentPage = totalPages;
    addRecordPositions({role, currentPage});
    let request = {
        'type':
            'getUsers',
        'params':
            {'page': currentPage, role}
    };
    updateRecordControls(elem, role);
    xHttpRequest(request, elem);
}

// eslint-disable-next-line no-unused-vars
function getNextRecord(elem, role) {
    let totalPages = getRecordPosition(role).totalPages;
    let currentPage = getRecordPosition(role).currentPage;
    if (currentPage < totalPages) {
        currentPage += 1;
    }
    addRecordPositions({role, currentPage});
    let request = {
        'type':
            'getUsers',
        'params':
            {'page': currentPage, role}
    };
    updateRecordControls(elem, role);
    xHttpRequest(request, elem);
}

// eslint-disable-next-line no-unused-vars
function getPrevRecord(elem, role) {
    let currentPage = getRecordPosition(role).currentPage;
    if (currentPage > 1) {
        currentPage -= 1;
    }
    addRecordPositions({role, currentPage});
    let request = {
        'type':
            'getUsers',
        'params':
            {'page': currentPage, role}
    };
    updateRecordControls(elem, role);
    xHttpRequest(request, elem);
}

function getCurrentRecord(elem, role) {
    let recordPosition = getRecordPosition(role);
    let totalPages = recordPosition.totalPages;
    let currentPage = recordPosition.currentPage;
    if (!recordPosition) {
        totalPages = Math.ceil((getRole(role).member_count) / 10);
        currentPage = 1;
        addRecordPositions({role, totalPages, currentPage});
    }
    let request = {
        'type':
            'getUsers',
        'params':
            {'page': currentPage, role}
    };
    updateRecordControls(elem, role);
    xHttpRequest(request, elem);
}

function getSelectedRecord(elem, role, recordNum) {
    let recordPosition = getRecordPosition(role);
    let totalPages = recordPosition.totalPages;
    let currentPage = Math.ceil(Number(recordNum));
    console.log(currentPage);
    if (!recordPosition) {
        totalPages = Math.ceil((getRole(role).member_count) / 10);
        currentPage = 1;
    }
    addRecordPositions({role, totalPages, currentPage});
    let request = {
        'type':
            'getUsers',
        'params':
            {'page': currentPage, role}
    };
    updateRecordControls(elem, role);
    xHttpRequest(request, elem);
}

function listenToUserRoleCollapsibleHeaders() {
    let roleHeaders = $(
        ".collapsible-user-roles .collapsible-header[data-role]"
    );
    console.log(roleHeaders);
    let i = 0;
    roleHeaders.each(function() {
        let idArr = roleHeaders[i].getAttribute('data-role').
            toLowerCase().
            split(" ");
        let id = "userRoleCollapsible";
        let idx = 0;
        idArr.forEach(function() {
            idArr[idx] = idArr[idx].
                charAt(0).toUpperCase() + idArr[idx].slice(1);
            id += idArr[idx];
            idx += 1;
        });
        roleHeaders[i].setAttribute("id", id);

        $(`#${id}`).on("click", function () {
            let self = $(`#${id}`)[0];
            let renderSelector = `#${id} ~ .collapsible-body `;
            renderSelector += `.collapsible .results-data`;
            let renderTarget = $(renderSelector)[0];
            let role;
            if (!self.parentElement.classList.contains("active")) {
                role = self.getAttribute("data-role");
                getCurrentRecord(renderTarget, role);
            }
        });
        i += 1;
    });
}

function listenToPageNumberInputs() {
    let pageNumberInputs = $('.results-control input.pageNumber');
    let i = 0;
    pageNumberInputs.each(function () {
        let self = pageNumberInputs[i];
        let totalRecordsSpan = self.nextElementSibling.nextElementSibling;

        function listenerAction() {
            let role = self.parentElement.parentElement.parentElement.
                    previousElementSibling.getAttribute('data-role');
            let pageNumber = Math.ceil(Number(self.value));
            if (isNaN(pageNumber) || self.value === "") {
                self.value = getRecordPosition(role).currentPage;
                return;
            }
            let totalRecords = Number(totalRecordsSpan.innerHTML);
            let target = self.parentElement.nextElementSibling;
            if (pageNumber > totalRecords) {
                pageNumber = totalRecords;
            } else if (pageNumber < 1) {
                pageNumber = 1;
            }
            self.value = pageNumber;
            getSelectedRecord(target, role, pageNumber);
        }

        function listenerReset() {
            let role = self.parentElement.parentElement.parentElement.
                    previousElementSibling.getAttribute('data-role');
            self.value = getRecordPosition(role).currentPage;
        }

        pageNumberInputs[i].addEventListener('keyup', function (e) {
            console.log(e.key);
            if (e.key === "Enter") {
                listenerAction();
            } else if (e.key === "Escape") {
                listenerReset();
            }
        });
        pageNumberInputs[i].addEventListener('focusout', function () {
            listenerReset();
        });
        i += 1;
    });
}

// eslint-disable-next-line no-unused-vars
function getRecord(record, self) {
    let target = self.parentElement.nextElementSibling;
    let role = self.parentElement.parentElement.parentElement.
        previousElementSibling.getAttribute("data-role");
    switch (record) {
    case 'first':
        getFirstRecord(target, role);
        break;
    case 'prev':
        getPrevRecord(target, role);
        break;
    case 'next':
        getNextRecord(target, role);
        break;
    case 'last':
        getLastRecord(target, role);
        break;
    }
}

listenToUserRoleCollapsibleHeaders();
listenToPageNumberInputs();