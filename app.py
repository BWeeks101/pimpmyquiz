import os
from flask import (
    Flask, flash, render_template,
    redirect, request, session, url_for, Markup)
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
if os.path.exists("env.py"):
    import env
import datetime


app = Flask(__name__)

app.config["MONGO_DBNAME"] = os.environ.get("MONGO_DBNAME")
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
app.secret_key = os.environ.get("SECRET_KEY")

mongo = PyMongo(app)


@app.route("/")
def landing():
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        # Get method
        return redirect(url_for("my_quizzes"))

    return redirect(url_for("quiz_search"))


@app.route("/my_quizzes")
def my_quizzes():
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        # Get method
        categories = getCategories()
        return render_template("my_quizzes.html", categories=categories)

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("login"))


@app.route("/quiz_search")
def quiz_search():
    categories = getCategories()
    return render_template("quiz_search.html", categories=categories)


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # check if username exists in db
        existing_user = mongo.db.users.find_one(
            {"user_id": request.form.get("user_id").lower()})

        if existing_user:
            flash("Username already exists")
            return redirect(url_for("register"))

        user_role_id = (mongo.db.user_roles.find_one(
            {'role': 'User'},
            {'_id': 1}
        ))['_id']

        register = {
            "role_id": ObjectId(user_role_id),
            "user_id": request.form.get("user_id").lower(),
            "pwd": generate_password_hash(request.form.get("pwd")),
            "email": request.form.get("email").lower(),
            "locked": False
        }
        mongo.db.users.insert_one(register)

        # put the new user into 'session' cookie
        session["user"] = request.form.get("user_id").lower()
        flash("Registration Successful")
        return redirect(url_for("my_quizzes", username=session["user"]))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # check if username exists in db
        existing_user = mongo.db.users.find_one(
            {"user_id": request.form.get("user_id").lower()},
            {"_id": 0, "user_id": 1, "pwd": 1, "role_id": 1, "locked": 1})

        user_role = mongo.db.user_roles.find_one(
            {"_id": ObjectId(existing_user['role_id'])},
            {"_id": 0, "role": 1})

        if existing_user:
            # ensure hashed password matches user input
            if check_password_hash(
                    existing_user["pwd"], request.form.get("pwd")):
                if existing_user["locked"] is True:
                    # account is locked
                    flash("Your account is currently locked.")
                    return redirect(url_for("login"))
                session["user"] = request.form.get("user_id").lower()
                session["user_role"] = user_role['role'].lower()
                flash("Welcome, {}".format(
                    request.form.get("user_id")))
                return redirect(url_for(
                    "my_quizzes", username=session["user"]))
            else:
                # invalid password match
                flash("Incorrect Username and/or Password")
                return redirect(url_for("login"))

        else:
            # username doesn't exist
            flash("Incorrect Username and/or Password")
            return redirect(url_for("login"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    if 'user' in session:
        # remove user from session cookies
        flash("You have been logged out")
        session.pop("user")

    return redirect(url_for("login"))


# Is user authorised for this function?
# not in session: always returns false
# auth_criteria: Required object.
#               auth (optional)
#                   Boolean.  Is user logged in?
#               is_admin (optional)
#                   Boolean. Is user a member of an admin role?
#               role (optional)
#                   String or List. Authorised user roles.
# Evaluates properties of user against auth_criteria
# If we have a match, return true.  Otherwise return false.
# returns: object.
#               auth
#                   Boolean.  Is the user authorised?
#               reason
#                   String (user not in session) or
#                   Object (returning user properties)
def auth_user(auth_criteria):
    if 'user' not in session:
        return {'auth': False, 'reason': 'Not Logged In'}
    else:
        is_admin = mongo.db.users.find_one(
            {'user_id': session['user'].lower()},
            {'_id': 1, 'role_id': 1})
        uid = is_admin['_id']
        role = mongo.db.user_roles.find_one(
            {'_id': ObjectId(is_admin['role_id'])})
        is_admin = mongo.db.role_groups.find_one(
            {'_id': ObjectId(role['role_group_id'])})
        if is_admin['role_group'] == 'Administrators Group':
            is_admin = True
        else:
            is_admin = False
        role = role['role']
        auth_vals = {'auth': True, 'is_admin': is_admin, 'role': role}
        auth = False
        score = 0
        score_target = len(auth_criteria.keys())
        # print('Auth Requires Score of: ' + str(score_target))
        for key in auth_criteria.keys():
            # print('Key: ' + str(key))
            # print(auth_criteria[key])
            if (auth_criteria[key] == auth_vals[key]):
                # print(auth_vals[key])
                # print('Match!')
                score += 1
            elif (type(auth_criteria[key]) is list and key == 'role'):
                # print("It's a list!")
                for auth_role in auth_criteria[key]:
                    if auth_role == auth_vals[key]:
                        # print(auth_vals[key])
                        # print('Match!')
                        score += 1
                        break
        # print('score: ' + str(score))
        if (score == score_target):
            auth = True

        return {'auth': auth, 'id': uid, 'reason': auth_vals}


# User Administration console
# Access restricted to Global Admin and User Account Admin.
@app.route("/admin_users", methods=["GET", "POST"])
def admin_users():
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        # POST Method
        if request.method == "POST":
            # Edit User Form Submission
            existing_user = mongo.db.users.find_one(
                {"user_id": request.form.get("orig_user_id").lower()},
                {"_id": 1})

            update_user = {
                "user_id": request.form.get("user_id").lower(),
                "email": request.form.get("email").lower(),
                "locked": request.form.get("locked")
            }

            # Massage locked value into boolean
            if update_user['locked'] is None:
                update_user['locked'] = False

            if update_user['locked'] == 'on':
                update_user['locked'] = True

            role = mongo.db.user_roles.find_one(
                {"role": request.form.get("role")},
                {"_id": 1})

            # Only allow a Global Admin to add users to the
            # Global Admin or User Account Admin roles
            if (request.form.get("role") == "Global Admin" or
                    request.form.get("role") == "User Account Admin"):
                if auth_state['reason']['role'] == "Global Admin":
                    update_user["role_id"] = ObjectId(role["_id"])
                else:
                    flash("Not Authorised to Add User to " +
                          request.form.get("role") + " Role")
            else:
                update_user["role_id"] = ObjectId(role["_id"])

            if request.form.get("pwd"):
                update_user["pwd"] = generate_password_hash(
                    request.form.get("pwd"))

            mongo.db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_user})

            flash("User Details Updated")
            return redirect(url_for("admin_users"))

        # GET Method
        global_admin = mongo.db.user_roles.find_one(
            {"role": "Global Admin"},
            {"_id": 1})['_id']

        user_account_admin = mongo.db.user_roles.find_one(
            {"role": "User Account Admin"},
            {"_id": 1})['_id']

        user_data_query = [{
                '$match': {
                    'role_id': {
                        '$nin': [
                            ObjectId(global_admin),
                            ObjectId(user_account_admin)
                        ]
                    }
                }
            }, {
                '$lookup': {
                    'from': 'user_roles',
                    'localField': 'role_id',
                    'foreignField': '_id',
                    'as': 'role_details'
                }
            }, {
                '$replaceRoot': {
                    'newRoot': {
                        '$mergeObjects': [{
                            '$arrayElemAt': [
                                '$role_details', 0
                            ]
                        }, '$$ROOT']
                    }
                }
            }, {
                '$lookup': {
                    'from': 'role_groups',
                    'localField': 'role_group_id',
                    'foreignField': '_id',
                    'as': 'role_group_details'
                }
            }, {
                '$replaceRoot': {
                    'newRoot': {
                        '$mergeObjects': [{
                            '$arrayElemAt': [
                                '$role_group_details', 0
                            ]
                        }, '$$ROOT']
                    }
                }
            }, {
                '$project': {
                    'role_group_details': 0,
                    'role_details': 0,
                    '_id': 0,
                    'role_group_id': 0,
                    'role_id': 0,
                    'pwd': 0
                }
            }, {
                '$sort': {
                    'role_group': 1,
                    'role': 1,
                    'user_id': 1
                }
            }, {
                '$facet': {
                    'roles': [{
                        '$group': {
                            '_id': {
                                'role': '$role',
                                'group': '$role_group',
                                'icon': '$role_icon',
                                'desc': '$role_desc'
                            },
                            'member_count': {
                                '$sum': 1
                            }
                        }
                    }, {
                        '$sort': {
                            '_id.role': 1
                        }
                    }],
                    'groups': [{
                        '$group': {
                            '_id': {
                                'group': '$role_group',
                                'icon': '$role_group_icon'
                            },
                            'member_count': {
                                '$sum': 1
                            }
                        }
                    }, {
                        '$sort': {
                            '_id.group': 1
                        }
                    }],
                    'total_users': [{
                        '$group': {
                            '_id': 'null',
                            'total': {
                                '$sum': 1
                            }
                        }
                    }]
                }
            }]

        # If user is Global Admin, remove the Global Admin and
        # User Account Admin role restrictions from the query
        if auth_state['reason']['role'] == 'Global Admin':
            user_data_query.pop(0)

        user_data = list(mongo.db.users.aggregate(user_data_query))
        user_roles = list()
        role_groups = list()
        total_users = int(user_data[0]['total_users'][0]['total'])

        for role in user_data[0]['roles']:
            user_roles.append({
                'role': role['_id']['role'],
                'role_group': role['_id']['group'],
                'role_icon': role['_id']['icon'],
                'role_desc': role['_id']['desc'],
                'member_count': role['member_count']
            })

        for group in user_data[0]['groups']:
            role_groups.append({
                'role_group': group['_id']['group'],
                'role_group_icon': group['_id']['icon'],
                'member_count': group['member_count']
            })

        return render_template(
            "admin_users.html",
            user_roles=user_roles,
            role_groups=role_groups
        )

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("my_quizzes"))


# Return user, role membership and role group membership counts
# Access restricted to Global Admin and User Account Admin.
def getUserTotals():
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        global_admin = mongo.db.user_roles.find_one(
            {"role": "Global Admin"},
            {"_id": 1})['_id']

        user_account_admin = mongo.db.user_roles.find_one(
            {"role": "User Account Admin"},
            {"_id": 1})['_id']

        query = [{
            '$match': {
                        'role_id': {
                            '$nin': [
                                ObjectId(global_admin),
                                ObjectId(user_account_admin)
                            ]
                        }
                    }
                }, {
            '$lookup': {
                'from': 'user_roles',
                'localField': 'role_id',
                'foreignField': '_id',
                'as': 'role_details'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [{
                        '$arrayElemAt': [
                            '$role_details',
                            0
                        ]
                    }, '$$ROOT']
                }
            }
        }, {
            '$lookup': {
                'from': 'role_groups',
                'localField': 'role_group_id',
                'foreignField': '_id',
                'as': 'role_group_details'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [{
                        '$arrayElemAt': [
                            '$role_group_details',
                            0
                        ]
                    }, '$$ROOT']
                }
            }
        }, {
            '$project': {
                'role_group_details': 0,
                'role_group_icon': 0,
                'role_details': 0,
                'role_icon': 0,
                '_id': 0,
                'role_group_id': 0,
                'role_id': 0,
                'pwd': 0
            }
        }, {
            '$sort': {
                'role_group': 1,
                'role': 1,
                'user_id': 1
            }
        }, {
            '$facet': {
                'roles': [{
                    '$group': {
                        '_id': {
                            'role': '$role',
                            'group': '$role_group',
                            'desc': '$role_desc'
                        },
                        'member_count': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$sort': {
                        '_id.role': 1
                    }
                }],
                'groups': [{
                    '$group': {
                        '_id': {
                            'group': '$role_group'
                        },
                        'member_count': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$sort': {
                        '_id.group': 1
                    }
                }],
                'total_users': [{
                    '$group': {
                        '_id': 'null',
                        'total': {
                            '$sum': 1
                        }
                    }
                }]
            }
        }]

        # If user is Global Admin, remove the Global Admin and
        # User Account Admin role restrictions from the query
        if auth_state['reason']['role'] == 'Global Admin':
            query.pop(0)

        data = list(mongo.db.users.aggregate(query))[0]
        user_roles = list()
        role_groups = list()

        for role in data['roles']:
            user_roles.append({
                'role': role['_id']['role'],
                'role_group': role['_id']['group'],
                'role_desc': role['_id']['desc'],
                'member_count': role['member_count']
            })

        for group in data['groups']:
            role_groups.append({
                'role_group': group['_id']['group'],
                'member_count': group['member_count']
            })

        results = {
            'user_roles': user_roles,
            'role_groups': role_groups,
            'total_users': data['total_users'][0]['total']
        }

        return results

    print(auth_state['auth'])
    print(auth_state['reason'])


# Returns formatted HTML output for user data sets
def buildUserHtml(user_data):
    html = '''
    <ul class="collection user-search-results">'''
    if user_data:
        for user in user_data:
            tTip = 'data-position="top" data-tooltip='
            tTipAlt = 'data-position="bottom" data-tooltip='
            iconClass = 'class="fas ' + user['role_icon']['class']
            iconClass += ' fa-fw tooltipped"'
            userRoleTip = tTip + '"' + user['role'] + '"'
            userRoleIcon = iconClass + ' ' + userRoleTip
            userId = user['user_id']
            userIdClass = 'class="title tooltipped" '
            userIdTip = tTip + '"' + userId + '"'
            userIdSpan = 'span ' + userIdClass + userIdTip
            email = user['email']
            emailClass = 'class="tooltipped" '
            emailHref = 'href="mailto:' + email + '"'
            emailTip = tTipAlt + '"' + email + '"'
            emailLink = emailClass + emailHref + emailTip
            emailIconClass = 'class="fas fa-envelope fa-fw"'
            editClass = 'class="light-blue-text text-darken-4 '
            editClass += 'modal-trigger tooltipped" '
            editHref = 'href="#editUserModal" '
            editTip = tTipAlt + '"Edit User" '
            editOnClick = 'onclick="popEditUserModal(\'' + userId + '\')"'
            editLink = editClass + editHref + editTip + editOnClick
            lockIconClass = 'class="red-text text-darken-4 fas fa-lock fa-fw"'
            lockIcon = lockIconClass + '></i'
            unlockIconClass = 'class="fas fa-unlock fa-fw"'
            unlockIcon = unlockIconClass + '></i'
            html += '''
        <li class="collection-item light-blue-text text-darken-4">
            <div class="row">
                <div class="col s8 m10 xl11">
                    <h6 class="truncate">
                        <i ''' + userRoleIcon + '''></i>
                        <''' + userIdSpan + '''>
                            ''' + userId + '''
                        </span>
                    </h6>
                    <h6 class="truncate">
                        <a ''' + emailLink + '''>
                            <i ''' + emailIconClass + '''></i>
                            <span class="title">
                                ''' + email + '''
                            </span>
                        </a>
                    </h6>
                </div>
                <div class="right-align col s4 m2 xl1">
                    <h5>
                        <a ''' + editLink + '''>'''
            if (user['locked']):
                html += '''
                            <i ''' + lockIcon + '''>'''
            else:
                html += '''
                            <i ''' + unlockIcon + '''>'''
            html += '''
                            <i class="fas fa-user-edit"></i>
                        </a>
                    </h5>
                </div>
            </div>
        </li>'''
    else:
        html += '''
        <li class="collection-item search-no-results '''
        html += 'light-blue-text text-darken-4 ' + '''center-align">
            <h5>
                <i class="fas fa-info fa-fw"></i>
                <span class="title">No Results.</span>
            </h5>
        </li>'''

    html += '''
    </ul>\n'''

    return html


# Returns list of quiz categories
def getCategories():
    categories_query = [{
        "$project": {
            "_id": 0
        }
    }]

    return list(mongo.db.categories.aggregate(categories_query))


# Returns formatted HTML output for quiz data sets
def buildQuizHtml(quiz_data, user_role):
    html = '''
    <ul class="collection quiz-search-results">'''
    if quiz_data:
        for quiz in quiz_data:
            tTip = 'data-position="top" data-tooltip='
            tTipAlt = 'data-position="bottom" data-tooltip='
            qCatClass = 'class="fas ' + quiz['category_icon']['class']
            qCatClass += ' fa-fw tooltipped"'
            qTipCat = tTip + '"' + quiz['category'] + '"'
            qCat = qCatClass + qTipCat
            qTitleClass = 'class="quiz-title tooltipped" '
            qTitle = 'span ' + qTitleClass + tTip + '"' + quiz['title'] + '"'
            qAuthorSpan = 'span class="tooltipped" '
            qAuthorText = 'Author: ' + quiz['author']
            qTipAuthor = tTipAlt + '"' + qAuthorText + '"'
            qAuthor = qAuthorSpan + qTipAuthor
            textClass = 'light-blue-text text-darken-4 '
            baseClass = 'class="' + textClass + 'tooltipped'
            secUrlClass = baseClass + '" '
            secTipQuiz = tTip + '"Quiz Sheet" '
            secHrefQuiz = 'href="/quiz_sheet?&id=' + quiz['id'] + '"'
            secQuizSheet = secUrlClass + secTipQuiz + secHrefQuiz
            secTipView = tTip + '"View Quiz" '
            secHrefView = 'href="/view_quiz?&id=' + quiz['id'] + '"'
            secViewQuiz = secUrlClass + secTipView + secHrefView
            secData = 'data-quizId="' + quiz['id'] + '" '
            secUrlCopyClass = baseClass + ' copy-quiz" '
            secTipCopy = tTip + '"Copy Quiz" '
            secCopyQuiz = secUrlCopyClass + secTipCopy + secData
            secTipEdit = tTip + '"Edit Quiz" '
            secHrefEdit = 'href="/edit_quiz?&id=' + quiz['id'] + '"'
            secEditQuiz = secUrlClass + secTipEdit + secHrefEdit
            secUrlDeleteClass = baseClass + ' del-quiz" '
            secTipDelete = tTip + '"Delete Quiz" '
            secDeleteQuiz = secUrlDeleteClass + secTipDelete + secData
            html += '''
        <li class="collection-item light-blue-text text-darken-4">
            <div class="row">
                <div class="col s7 m8 l9 xl10">
                    <h6 class="truncate">
                        <i ''' + qCat + '''></i>
                        <'''
            html += qTitle + '>' + quiz['title'] + '</span>' + '''
                    </h6>
                    <div class = "truncate">
                        '''
            html += '<' + qAuthor + '>' + qAuthorText + '''</span>
                    </div>
                </div>
                <div class="col s5 m4 l3 xl2 '''
            html += textClass + '''right-align">
                    <a ''' + secQuizSheet + '''>
                        <i class="far fa-file-alt fa-fw"></i>
                    </a>
                    <a ''' + secViewQuiz + '''>
                        <i class="fas fa-eye fa-fw"></i>
                    </a>'''
            if ('user' in session):
                html += '''
                    <a ''' + secCopyQuiz + '''href="#!">
                        <i class="fas fa-copy fa-fw"></i>
                    </a>'''
            else:
                html += '''
                    <span class="grey-text">
                        <i class="fas fa-copy fa-fw"></i>
                    </span>'''
            if (('user' in session and quiz['author'] == session['user']) or
                    (user_role == 'Global Admin' or
                        user_role == 'Content Admin')):
                html += '''
                    <a ''' + secEditQuiz + '''>
                        <i class="fas fa-edit fa-fw"></i>
                    </a>
                    <a ''' + secDeleteQuiz + '''href="#!">
                        <i class="fas fa-trash fa-fw"></i>
                    </a>'''
            else:
                html += '''
                    <span class="grey-text">
                        <i class="fas fa-edit fa-fw"></i>
                    </span>
                    <span class="grey-text">
                        <i class="fas fa-trash fa-fw"></i>
                    </span>'''
            html += '''
                </div>
            </div>
        </li>'''
    else:
        html += '''
        <li class="collection-item search-no-results '''
        html += 'light-blue-text text-darken-4 ' + '''center-align">
            <h5>
                <i class="fas fa-info fa-fw"></i>
                <span class="title">No Results.</span>
            </h5>
        </li>'''

    html += '''
    </ul>\n'''

    return html


# Returns quiz query parameters
def buildQuizQuery(params):
    if ('userId' not in params):
        params['userId'] = None

    query = [{
        "$search": {
            "wildcard": {
                "query": params['searchStr'],
                "path": ["title"],
                "allowAnalyzedField": True
            }
        }
    }, {
        '$match': {
            'author_id': params['userId']
        }
    }, {
        '$lookup': {
            'from': 'categories',
            'localField': 'category_id',
            'foreignField': '_id',
            'as': 'category_details'
        }
    }, {
        '$match': {
            'category_details.category': params['category']
        }
    }, {
        '$lookup': {
            'from': 'users',
            'localField': 'author_id',
            'foreignField': '_id',
            'as': 'author_details'
        }
    }, {
        '$facet': {
            'results': [{
                '$project': {
                    '_id': {
                        '$toString': "$_id"
                    },
                    'title': 1,
                    'author_details.user_id': 1,
                    'category_details.category': 1,
                    'category_details.category_icon': 1
                }
            }, {
                '$sort': {
                        'title': 1
                }
            }, {
                '$skip': params['skip']
            }, {
                '$limit': params['limit']
            }],
            'total_results': [{
                '$group': {
                    '_id': 'null',
                    'total': {
                        '$sum': 1
                    }
                }
            }]
        }
    }]
    category_index = 3
    if (params['searchType'] == 'globalQuizSearch'):
        query.pop(1)
        category_index = 2
    if (params['category'] == 'undefined' or params['category'] == 'All'):
        query.pop(category_index)

    return query


# Formats quiz query results for return to client
def processQuizQueryResults(params):
    quiz_data = params['quiz_data']
    limit = params['limit']
    total_quizzes = 0
    if quiz_data[0]['total_results']:
        total_quizzes = int(quiz_data[0]['total_results'][0]['total'])

    # Calculate total pages based on:
    #   total quizzes / number of returned records
    # total_quizzes // limit
    #   divide number of quizzes by the page limit, returning an integer
    #   (floor division)
    # total_quizzes % limit > 0
    #   if remainder of total_quizzes / limit is greater than 0, add 1
    #   (modulus operation, then if result > 0 return 1 (true))
    total_pages = (total_quizzes // limit) + (total_quizzes % limit > 0)
    quizzes = []
    for quiz in quiz_data[0]['results']:
        quizzes.append({
            'id': quiz['_id'],
            'title': quiz['title'],
            'author': quiz['author_details'][0]['user_id'],
            'category': quiz['category_details'][0]['category'],
            'category_icon': quiz['category_details'][0]['category_icon']
        })
    html = buildQuizHtml(quizzes, params['user_role'])

    results = {
        'request': {
            'quizSearch': params['searchStr'],
            'currentPage': params['page'],
            'totalPages': total_pages
        },
        'total_results': total_quizzes,
        'type': params['searchType'],
        'html': html,
        'quiz_data': quizzes
    }

    return results


# My Quiz Search
# Return batch of 10 quizzes for provided search criteria for current user
@app.route("/myQuizSearch")
def myQuizSearch():
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        page = request.args.get('page')
        if (page == 'undefined' or page is None):
            page = 1
        else:
            page = int(page)
        searchStr = request.args.get('searchStr')
        if (searchStr == 'undefined' or searchStr is None):
            searchStr = '*'
        category = request.args.get('category')
        if (category == 'undefined' or category is None):
            category = 'All'
        limit = 10
        skip = (page * limit) - limit

        user_quiz_query = buildQuizQuery({
            'searchType': 'myQuizSearch',
            'userId': auth_state['id'],
            'page': page,
            'searchStr': searchStr,
            'category': category,
            'limit': limit,
            'skip': skip
        })

        quiz_data = list(mongo.db.quizzes.aggregate(user_quiz_query))

        results = processQuizQueryResults({
            'searchType': 'myQuizSearch',
            'user_role': auth_state['reason']['role'],
            'quiz_data': quiz_data,
            'limit': limit,
            'searchStr': searchStr,
            'page': page
        })

        return results

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("login"))


# Global Quiz Search
# Return batch of 10 quizzes for provided search criteria
@app.route("/globalQuizSearch")
def globalQuizSearch():
    user_role = None
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])

        user_role = auth_state['reason']['role']

    page = request.args.get('page')
    if (page == 'undefined' or page is None):
        page = 1
    else:
        page = int(page)
    searchStr = request.args.get('searchStr')
    if (searchStr == 'undefined' or searchStr is None):
        searchStr = '*'
    category = request.args.get('category')
    if (category == 'undefined' or category is None):
        category = 'All'
    limit = 10
    skip = (page * limit) - limit

    user_quiz_query = buildQuizQuery({
        'searchType': 'globalQuizSearch',
        'page': page,
        'searchStr': searchStr,
        'category': category,
        'limit': limit,
        'skip': skip
    })

    quiz_data = list(mongo.db.quizzes.aggregate(user_quiz_query))

    results = processQuizQueryResults({
        'searchType': 'globalQuizSearch',
        'user_role': user_role,
        'quiz_data': quiz_data,
        'limit': limit,
        'searchStr': searchStr,
        'page': page
    })

    return results


# Delete Quiz
# Delete quiz and associated rounds and questions
@app.route("/delete_quiz")
def deleteQuiz():
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        quiz_id = ObjectId(request.args.get('id'))
        user_id = mongo.db.users.find_one({'user_id': session['user']})['_id']
        quiz = mongo.db.quizzes.find_one({"_id": quiz_id})
        if ((quiz['author_id'] == user_id) or
                (auth_state['reason']['role'] == 'Global Admin' or
                    auth_state['reason']['role'] == 'Content Admin')):
            mongo.db.quizzes.find_one_and_delete({"_id": quiz_id})
            rounds = list(mongo.db.rounds.find({"quiz_id": quiz_id}))
            mongo.db.rounds.delete_many({"quiz_id": quiz_id})
            for round in rounds:
                mongo.db.questions.delete_many({"round_id": round['_id']})

            return redirect(request.referrer)

        flash("Permission Denied")
        return redirect(request.referrer)

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("login"))


# Build View Quiz Data Set
def buildViewQuizDataSet(params):
    quiz = mongo.db.quizzes.find_one({
        '_id': params['quiz_id']
    }, {
        # '_id': 1,
        'title': 1,
        'category_id': 1,
        'author_id': 1
    })
    quiz['_id'] = str(quiz['_id'])
    category = mongo.db.categories.find_one({
        '_id': quiz['category_id']
    }, {
        '_id': 0
    })
    quiz['category'] = category['category']
    quiz['category_icon'] = category['category_icon']
    quiz.pop('category_id')
    quiz['author'] = mongo.db.users.find_one({
        '_id': quiz['author_id']
    }, {
        '_id': 0,
        'user_id': 1
    })['user_id']
    quiz.pop('author_id')
    quiz['rounds'] = list(mongo.db.rounds.find({
        'quiz_id': params['quiz_id']
    }, {
        'round_num': 1,
        'title': 1,
        'category_id': 1
    }).sort('round_num'))
    for round in quiz['rounds']:
        category = mongo.db.categories.find_one({
            '_id': round['category_id']
        }, {
            '_id': 0
        })
        round.pop('category_id')
        round['category'] = category['category']
        round['category_icon'] = category['category_icon']
        if (params['show_answers']):
            round['questions'] = list(mongo.db.questions.find({
                'round_id': round['_id']
            }, {
                '_id': 1,
                'question_num': 1,
                'question_text': 1,
                'question_img_url': 1,
                'answer_text': 1,
                'answer_img_url': 1,
                'multiple_choice': 1,
                'multi_count': 1,
                'multiple_choice_options': 1
            }).sort('question_num'))
        else:
            round['questions'] = list(mongo.db.questions.find({
                'round_id': round['_id']
            }, {
                '_id': 1,
                'question_num': 1,
                'question_text': 1,
                'question_img_url': 1,
                'multiple_choice': 1,
                'multi_count': 1,
                'multiple_choice_options.option_num': 1,
                'multiple_choice_options.answer_text': 1,
                'multiple_choice_options.answer_img_url': 1
            }).sort('question_num'))
        round['_id'] = str(round['_id'])
        isPictureRound = True
        for question in round['questions']:
            question['_id'] = str(question['_id'])
            if isPictureRound is True:
                if (len(question['question_img_url']) == 0 or
                        len(question['question_text']) > 0 or
                        question['multiple_choice'] is True):
                    isPictureRound = False
        round['isPictureRound'] = isPictureRound

    return quiz


def transposeWithBoolean(val):
    if val is None or val == 'undefined':
        val = False
    elif val == 'on':
        val = True

    return val


def getCategoryId(category):
    category_id = mongo.db.categories.find_one(
        {'category': category},
        {'_id': 1}
    )

    if category_id is not None:
        category_id = category_id['_id']

    return category_id


def createQuestion(rId, qId, question_data):
    multiple_choice = request.form.get('quizMulti_' + rId + '_' + qId)

    multiple_choice = transposeWithBoolean(multiple_choice)

    # Massage multiple_choice value into boolean
    if multiple_choice is False:
        question_data['answer_text'] = request.form.get(
                'answer_' + rId + '_' + qId)
        question_data['answer_img_url'] = request.form.get(
                'a_img_' + rId + '_' + qId)

        question_data['multi_count'] = 0
        question_data['multiple_choice'] = multiple_choice

    if multiple_choice is True:
        multi_array = []
        multi_count = int(request.form.get(
            'multiCount_' + rId + '_' + qId
        )) + 1
        for multi in range(1, multi_count):
            answer_text = request.form.get(
                'answer_' + rId + '_' + qId + '_' + str(multi))
            correct = request.form.get(
                'correct_' + rId + '_' + qId + '_' + str(multi))
            answer_url = request.form.get(
                'a_img_' + rId + '_' + qId + '_' + str(multi))

            correct = transposeWithBoolean(correct)

            multi_array.append({
                'option_num': int(multi),
                'answer_text': answer_text,
                'correct': correct,
                'answer_img_url': answer_url
            })

        question_data['multi_count'] = len(multi_array)
        question_data['multiple_choice_options'] = multi_array

    mongo.db.questions.insert_one(question_data)

    question_id = mongo.db.questions.find_one(
        {'author_id': question_data['author_id'],
            'round_id': question_data['round_id'],
            'question_text': question_data['question_text']},
        {'_id': 1}
    )['_id']

    mongo.db.questions.update_one(
        {'_id': question_id},
        {'$set': {'copy_of': question_id}}
    )


def createRound(rId, round_data):
    mongo.db.rounds.insert_one(round_data)

    round_id = mongo.db.rounds.find_one(
        {'author_id': round_data['author_id'],
            'quiz_id': round_data['quiz_id'],
            'title': round_data['title']},
        {'_id': 1}
    )['_id']

    mongo.db.rounds.update_one(
        {'_id': round_id},
        {'$set': {'copy_of': round_id}}
    )

    # Create Questions
    question_count = int(request.form.get('questionCount_' + rId)) + 1
    print('QUESTION COUNT')
    print(question_count)
    for qId in range(1, question_count):
        qId = str(qId)
        print('QID')
        print(qId)
        question_data = {
            'author_id': round_data['author_id'],
            'date': round_data['date'],
            'round_id': round_id,
            'question_num': int(qId),
            'question_text': request.form.get(
                'question_' + rId + '_' + qId
            ),
            'question_img_url': request.form.get(
                'q_img_' + rId + '_' + qId
            ),
            'public': False
        }
        createQuestion(rId, qId, question_data)


def createQuiz(author_id):
    quiz_category = request.form.get('quizCategory')
    category_id = getCategoryId(quiz_category)

    quiz_data = {
        'author_id': author_id,
        'date': datetime.datetime.now(),
        'title': request.form.get('quiz_title'),
        'category_id': category_id,
        'public': False
    }
    mongo.db.quizzes.insert_one(quiz_data)

    quiz_id = mongo.db.quizzes.find_one(
        {'author_id': quiz_data['author_id'],
            'title': quiz_data['title']},
        {'_id': 1}
    )['_id']

    mongo.db.quizzes.update_one(
        {'_id': quiz_id},
        {'$set': {'copy_of': quiz_id}}
    )

    # Create Rounds
    round_count = int(request.form.get('roundCount')) + 1
    for rId in range(1, round_count):
        rId = str(rId)
        if (quiz_category.lower() == 'general knowledge'):
            round_category_id = getCategoryId(
                request.form.get('roundCategory_' + rId)
            )
        else:
            round_category_id = category_id

        round_data = {
            'quiz_id': quiz_id,
            'round_num': int(rId),
            'title': request.form.get('round_title_' + rId),
            'author_id': author_id,
            'date': quiz_data['date'],
            'category_id': round_category_id,
            'public': False
        }
        createRound(rId, round_data)

    return quiz_id


# Copy Quiz for Current User
@app.route("/copy_quiz")
def copyQuiz():
    # Check user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])

        quiz_id = ObjectId(request.args.get('id'))
        author_id = auth_state['id']

        quiz = mongo.db.quizzes.find_one({
            '_id': quiz_id
        }, {
            'copy_of': 0,
            'author_id': 0,
            'date': 0
        })
        quiz['copy_of'] = quiz['_id']
        quiz.pop('_id')
        quiz['author_id'] = author_id
        quiz['date'] = datetime.datetime.now()
        quiz['title'] = request.args.get('title')
        validate_title = validateQuizTitle(quiz['title'])
        if validate_title is False:
            quiz['title'] = quiz['title'] + ' - ' + str(quiz['date'])

        q_id = mongo.db.quizzes.insert_one(quiz).inserted_id

        rounds = list(mongo.db.rounds.find({
            'quiz_id': quiz_id
        }, {
            'quiz_id': 0,
            'copy_of': 0,
            'author_id': 0,
            'date': 0
        }).sort('round_num'))
        for round in rounds:
            questions = list(mongo.db.questions.find({
                'round_id': round['_id']
            }, {
                'round_id': 0,
                'copy_of': 0,
                'author_id': 0,
                'date': 0
            }).sort('question_num'))
            round['quiz_id'] = q_id
            round['copy_of'] = round['_id']
            round.pop('_id')
            round['author_id'] = author_id
            round['date'] = quiz['date']
            r_id = mongo.db.rounds.insert_one(round).inserted_id
            for question in questions:
                question['round_id'] = r_id
                question['copy_of'] = question['_id']
                question.pop('_id')
                question['author_id'] = author_id
                question['date'] = quiz['date']
            mongo.db.questions.insert_many(questions)

        flash("Quiz Copied")
        return redirect(request.referrer)

    # If not logged in, redirect to login
    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("login"))


# Quiz Sheet
# View quiz sheet (without answers) as a web page
@app.route("/quiz_sheet", endpoint="quiz_sheet")
# View Quiz
# View quiz as a web page
@app.route("/view_quiz", endpoint="view_quiz")
# Edit Quiz
@app.route("/edit_quiz", methods=["GET", "POST"], endpoint="edit_quiz")
def displayQuiz():
    # Set default values
    quiz_id = ObjectId(request.args.get('id'))

    params = {
        'show_answers': False,
        'quiz_id': quiz_id
    }

    # View Quiz request
    if request.endpoint == 'view_quiz':
        params['show_answers'] = True

        quiz = buildViewQuizDataSet(params)

        return render_template("view_quiz.html", viewQuiz=quiz)

        # If not logged in, redirect to login
        print(auth_state['auth'])
        print(auth_state['reason'])
        flash("Permission Denied")
        return redirect(url_for("login"))

    # Edit Quiz request
    elif request.endpoint == 'edit_quiz':
        # Check user is logged in, and member of Global or Content admin
        auth_criteria = {
            'is_admin': True,
            'role': [
                'Global Admin',
                'Content Admin'
            ]
        }
        auth_state = auth_user(auth_criteria)
        # If user is logged in
        if type(auth_state['reason']) != str:
            if auth_state['reason']['auth'] is True:
                # Get the author_id
                author_id = mongo.db.quizzes.find_one({
                    '_id': quiz_id
                }, {
                    '_id': 0,
                    'author_id': 1
                })['author_id']
        # If user is authorised, or user is author
        if auth_state['auth'] or (
                'id' in auth_state and auth_state['id'] == author_id):
            print(auth_state['auth'])
            print(auth_state['reason'])

            if request.method == 'POST':
                # Quiz ID
                quiz_id = ObjectId(request.args.get('id'))

                quiz_category = request.form.get('quizCategory')

                # Get category_id
                category_id = getCategoryId(quiz_category)

                # Update quiz doc
                mongo.db.quizzes.update_one(
                    {'_id': quiz_id},
                    {'$set': {
                        'title': request.form.get('quiz_title'),
                        'category_id': category_id
                    }}
                )

                # Existing Round Id List
                round_id_list = list(mongo.db.rounds.find({
                    'quiz_id': quiz_id
                }, {
                    '_id': 1
                }))

                # Get Round Count
                round_count = int(request.form.get('roundCount')) + 1

                # Initialise Round Deletion List
                delete_list = []
                for round_id in round_id_list:
                    delete_list.append(round_id['_id'])

                # Finalise Round Deletion List
                for rId in range(1, round_count):
                    rnd_id = request.form.get('round_' + str(rId) + '_id')
                    for round_id in round_id_list:
                        if (round_id['_id'] == ObjectId(rnd_id) and
                                rnd_id is not None):
                            delete_list.remove(round_id['_id'])
                            break

                # If any rounds remain in the deletion list,
                # delete them and any associated questions
                if len(delete_list) > 0:
                    for rId in delete_list:
                        mongo.db.rounds.find_one_and_delete({'_id': rId})
                        mongo.db.questions.delete_many({'round_id': rId})

                # Update rounds
                for rId in range(1, round_count):
                    rId = str(rId)
                    if (quiz_category.lower() == 'general knowledge'):
                        round_category_id = getCategoryId(
                            request.form.get('roundCategory_' + rId)
                        )
                    else:
                        round_category_id = category_id

                    round_id = request.form.get('round_' + rId + '_id')
                    # No round_id, so this is a new round
                    if round_id is None:
                        round_data = {
                            'quiz_id': quiz_id,
                            'round_num': int(rId),
                            'title': request.form.get('round_title_' + rId),
                            'author_id': auth_state['id'],
                            'date': datetime.datetime.now(),
                            'category_id': round_category_id,
                            'public': False
                        }
                        createRound(rId, round_data)
                    # Otherwise the round exists, so update it
                    else:
                        round_id = ObjectId(round_id)
                        mongo.db.rounds.update_one(
                            {'_id': round_id},
                            {'$set': {
                                'title': request.form.get(
                                    'round_title_' + rId
                                ),
                                'category_id': round_category_id
                            }}
                        )

                        # Existing Question Id List
                        question_id_list = list(mongo.db.questions.find({
                            'round_id': round_id
                        }, {
                            '_id': 1
                        }))

                        # Get question count
                        question_count = int(request.form.get(
                            'questionCount_' + rId
                        )) + 1

                        # Initialise question deletion list
                        delete_list = []
                        for question_id in question_id_list:
                            delete_list.append(question_id['_id'])

                        # Finalise question deletion list
                        for qId in range(1, question_count):
                            qst_id = request.form.get('question_' + rId +
                                                      '_' + str(qId) + '_id')
                            for question_id in question_id_list:
                                if (question_id['_id'] == ObjectId(qst_id) and
                                        qst_id is not None):
                                    delete_list.remove(question_id['_id'])
                                    break

                        # If any questions remain in the deletion list,
                        # delete them
                        if len(delete_list) > 0:
                            for qId in delete_list:
                                mongo.db.questions.find_one_and_delete({
                                  '_id': qId
                                })

                        # Update Questions
                        for qId in range(1, question_count):
                            qId = str(qId)
                            question_id = request.form.get(
                                'question_' + rId + '_' + qId + '_id'
                            )
                            # No question id, so this is a new question
                            if question_id is None:
                                question_data = {
                                    'author_id': auth_state['id'],
                                    'date': datetime.datetime.now(),
                                    'round_id': round_id,
                                    'question_num': int(qId),
                                    'question_text': request.form.get(
                                        'question_' + rId + '_' + qId
                                    ),
                                    'question_img_url': request.form.get(
                                        'q_img_' + rId + '_' + qId
                                    ),
                                    'public': False
                                }
                                createQuestion(rId, qId, question_data)
                            # Otherwise this question exists, so update it
                            else:
                                question_id = ObjectId(question_id)
                                update_question = {
                                    'question_text': request.form.get(
                                        'question_' + rId + '_' + qId
                                    ),
                                    'question_img_url': request.form.get(
                                        'q_img_' + rId + '_' + qId
                                    )
                                }

                                multiple_choice = request.form.get(
                                    'quizMulti_' + rId + '_' + qId
                                )

                                multiple_choice = transposeWithBoolean(
                                    multiple_choice
                                )

                                # Massage multiple_choice value into boolean
                                if multiple_choice is False:
                                    update_question[
                                        'answer_text'
                                    ] = request.form.get(
                                        'answer_' + rId + '_' + qId
                                    )
                                    update_question[
                                        'answer_img_url'
                                    ] = request.form.get(
                                        'a_img_' + rId + '_' + qId
                                    )

                                    update_question[
                                        'multiple_choice'
                                    ] = multiple_choice

                                    update_question[
                                        'multi_count'
                                    ] = 0

                                if multiple_choice is True:
                                    multi_array = []
                                    multi_count = int(request.form.get(
                                        'multiCount_' + rId + '_' + qId
                                    )) + 1
                                    for multi in range(1, multi_count):
                                        answer_text = request.form.get(
                                            'answer_' + rId + '_' + qId +
                                            '_' + str(multi))
                                        correct = request.form.get(
                                            'correct_' + rId + '_' + qId +
                                            '_' + str(multi))
                                        answer_url = request.form.get(
                                            'a_img_' + rId + '_' + qId +
                                            '_' + str(multi))

                                        correct = transposeWithBoolean(correct)

                                        multi_array.append({
                                            'option_num': int(multi),
                                            'answer_text': answer_text,
                                            'correct': correct,
                                            'answer_img_url': answer_url
                                        })

                                    update_question[
                                        'multi_count'
                                    ] = len(multi_array)

                                    update_question[
                                        'multiple_choice_options'
                                    ] = multi_array

                                update_params = [
                                    {'$set': update_question}
                                ]

                                if multiple_choice is False:
                                    update_params.append(
                                        {'$unset': 'multiple_choice_options'}
                                    )

                                mongo.db.questions.update_one(
                                    {'_id': question_id},
                                    update_params
                                )

                flash("Quiz Saved")
                cancel_edit = request.form.get('cancel_edit')
                if cancel_edit is None:
                    return redirect(request.referrer)

                return redirect(request.referrer +
                                '&cancel_edit=' + cancel_edit)

            params['show_answers'] = True

            quiz = buildViewQuizDataSet(params)

            category_data = getCategories()

            cancel_edit = request.args.get('cancel_edit')
            if cancel_edit is None:
                cancel_edit = request.referrer
            if cancel_edit is not None and cancel_edit.find('quiz_search') > 1:
                cancel_edit = url_for('quiz_search')
            else:
                cancel_edit = url_for('my_quizzes')
            return render_template("edit_quiz.html",
                                   quiz=quiz,
                                   quiz_categories=category_data,
                                   cancel_edit=cancel_edit)

        # If not authorised or author
        print(auth_state['auth'])
        print(auth_state['reason'])
        flash("Permission Denied")
        # If not logged in redirect to login
        if auth_state['auth'] is False and type(auth_state['reason']) == str:
            return redirect(url_for('login'))

        # If logged in, redirect to quiz_search
        return redirect(url_for('quiz_search'))

    quiz = buildViewQuizDataSet(params)

    return render_template("quiz_sheet.html", viewQuiz=quiz)


def validateQuizTitle(quiz_title, quiz_id=None):
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])

        author_id = auth_state['id']

        if quiz_id is not None:
            author_id = mongo.db.quizzes.find_one({
                '_id': ObjectId(quiz_id)
            }, {
                '_id': 0,
                'author_id': 1
            })

            if author_id is not None:
                author_id = author_id['author_id']

        if (author_id is not None and (author_id == auth_state['id'] or
            (auth_state['reason']['role'] == 'Global Admin' or
                auth_state['reason']['role'] == 'Content Admin'))):

            validate = mongo.db.quizzes.find_one(
                {
                    'title': quiz_title,
                    'author_id': author_id
                }, {
                    '_id': 1
                })
            if validate:
                if ObjectId(quiz_id) == validate['_id']:
                    validate = True
                else:
                    validate = False
            else:
                validate = True

            return validate

        print('author_id Not Found')
        print(author_id)
        flash("Permission Denied")
        return redirect(url_for("quiz_search"))

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("login"))


@app.route("/validate_quiz_title")
def validate_quiz_title():
    quiz_title = request.args.get('quizTitle')
    quiz_id = request.args.get('id')

    validate_title = validateQuizTitle(quiz_title, quiz_id)
    # Convert python boolean to js boolean
    if validate_title is False:
        validate_title = 'false'
    else:
        validate_title = 'true'

    return validate_title


# User Search
# Return batch of 10 users for provided search criteria.
# Access restricted to Global Admin and User Account Admin.
@app.route("/userSearch")
def userSearch():
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        page = int(request.args.get('page'))
        searchStr = request.args.get('searchStr')
        limit = 10
        skip = (page * limit) - limit

        global_admin = mongo.db.user_roles.find_one(
            {"role": "Global Admin"},
            {"_id": 1})['_id']

        user_account_admin = mongo.db.user_roles.find_one(
            {"role": "User Account Admin"},
            {"_id": 1})['_id']

        search_query = [{
            "$search": {
                "wildcard": {
                    "query": request.args.get('searchStr'),
                    "path": ["user_id", "email"],
                    "allowAnalyzedField": True
                }
            }
        }, {
            '$match': {
                'role_id': {
                    '$nin': [
                        ObjectId(global_admin),
                        ObjectId(user_account_admin)
                    ]
                }
            }
        }, {
            '$lookup': {
                'from': 'user_roles',
                'localField': 'role_id',
                'foreignField': '_id',
                'as': 'role_details'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [{
                        '$arrayElemAt': [
                            '$role_details',
                            0
                        ]
                    }, '$$ROOT']
                }
            }
        }, {
            '$lookup': {
                'from': 'role_groups',
                'localField': 'role_group_id',
                'foreignField': '_id',
                'as': 'role_group_details'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [{
                        '$arrayElemAt': [
                            '$role_group_details',
                            0
                        ]
                    }, '$$ROOT']
                }
            }
        }, {
            '$facet': {
                'results': [{
                    '$project': {
                        'role_group_details': 0,
                        'role_group_icon': 0,
                        'role_details': 0,
                        'role_desc': 0,
                        '_id': 0,
                        'role_group_id': 0,
                        'role_id': 0,
                        'pwd': 0
                    }
                }, {
                    '$sort': {
                        'role_group': 1,
                        'role': 1,
                        'user_id': 1
                    }
                }, {
                    '$skip': skip
                }, {
                    '$limit': limit
                }],
                'total_results': [{
                    '$group': {
                        '_id': 'null',
                        'total': {
                            '$sum': 1
                        }
                    }
                }]
            }
        }]

        # If user is Global Admin, remove the Global Admin and
        # User Account Admin role restrictions from the query
        if auth_state['reason']['role'] == 'Global Admin':
            search_query.pop(1)

        user_data = list(mongo.db.users.aggregate(search_query))[0]
        total_users = 0
        if user_data['total_results']:
            total_users = int(user_data['total_results'][0]['total'])

        # Calculate total pages based on:
        #   total users / number of returned records
        # total_users // limit
        #   divide number of users by the page limit, returning an integer
        #   (floor division)
        # total_users % limit > 0
        #   if remainder of total_users / limit is greater than 0, add 1
        #   (modulus operation, then if result > 0 return 1 (true))
        total_pages = (total_users // limit) + (total_users % limit > 0)

        html = buildUserHtml(user_data['results'])

        results = {
            'request': {
                'userSearch': searchStr,
                'currentPage': page,
                'totalPages': total_pages
            },
            'total_results': total_users,
            'type': 'userSearch',
            'html': html,
            'user_data': user_data['results']
        }

        return results

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("my_quizzes"))


# Get Users
# Return batch of 10 users for specified role group.
# Access restricted to Global Admin and User Account Admin.
@app.route("/getUsers")
def getUsers():
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        # Get Batch of 10 Users
        page = int(request.args.get('page'))
        role = request.args.get('role')
        limit = 10
        print('PAGE: ' + str(page))
        print('ROLE: ' + role)
        print('LIMIT: ' + str(limit))

        user_role_id = (mongo.db.user_roles.find_one(
            {'role': role},
            {'_id': 1}
        ))['_id']

        totals = getUserTotals()

        for user_role in totals['user_roles']:
            if user_role['role'] == role:
                member_count = user_role['member_count']
                break

        # Calculate total pages based on:
        #   total role membership / number of returned records
        # member_count // limit
        #   divide number of members by the page limit, returning an integer
        #   (floor division)
        # member_count % limit > 0
        #   if remainder of member_count / limit is greater than 0, add 1
        #   (modulus operation, then if result > 0 return 1 (true))
        total_pages = (member_count // limit) + (member_count % limit > 0)
        print('TOTAL PAGES: ' + str(total_pages))

        if (page > total_pages):
            page = total_pages

        skip = (page * limit) - limit
        query = [{
            '$match': {
                'role_id': ObjectId(user_role_id)
            }
        }, {
            '$lookup': {
                'from': 'user_roles',
                'localField': 'role_id',
                'foreignField': '_id',
                'as': 'role_details'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [{
                        '$arrayElemAt': [
                            '$role_details',
                            0
                        ]
                    }, '$$ROOT']
                }
            }
        }, {
            '$lookup': {
                'from': 'role_groups',
                'localField': 'role_group_id',
                'foreignField': '_id',
                'as': 'role_group_details'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [{
                        '$arrayElemAt': [
                            '$role_group_details',
                            0
                        ]
                    }, '$$ROOT']
                }
            }
        }, {
            '$project': {
                'role_group_details': 0,
                'role_group_icon': 0,
                'role_details': 0,
                'role_desc': 0,
                '_id': 0,
                'role_group_id': 0,
                'role_id': 0,
                'pwd': 0
            }
        }, {
            '$sort': {
                'role_group': 1,
                'role': 1,
                'user_id': 1
            }
        }, {
            '$skip': skip
        }, {
            '$limit': limit
        }]

        user_data = list(mongo.db.users.aggregate(query))
        # print(user_data)

        html = buildUserHtml(user_data)

        results = {
            'type': 'getUsers',
            'request': {
                'role': role,
                'currentPage': page,
                'totalPages': total_pages
            },
            'totals': {
                'user_roles': totals['user_roles'],
                'role_groups': totals['role_groups']
            },
            'html': html,
            'user_data': user_data
        }

        return results

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("my_quizzes"))


@app.route("/new_quiz", methods=["GET", "POST"])
def new_quiz():
    # Check user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])

        if request.method == "POST":
            # Create Quiz
            quiz_id = createQuiz(auth_state['id'])

            flash('Quiz Created')
            return redirect(url_for('edit_quiz', id=quiz_id))

        category_data = getCategories()
        return render_template("new_quiz.html", quiz_categories=category_data)

    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(host=os.environ.get("IP"),
            port=int(os.environ.get("PORT")),
            debug=True)
