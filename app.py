import os
from flask import (
    Flask, flash, render_template,
    redirect, request, session, url_for)
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
@app.route("/home")
def home():
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        # Get method
        categories = getCategories()
        return render_template("home.html", categories=categories)

    print(auth_state['auth'])
    print(auth_state['reason'])
    flash("Permission Denied")
    return redirect(url_for("login"))


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
        return redirect(url_for("home", username=session["user"]))

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
                    "home", username=session["user"]))
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
    return redirect(url_for("home"))


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
            <ul class="collection">'''
    if user_data:
        for user in user_data:
            iconClass = 'fas ' + user['role_icon']['class'] + ' fa-fw'
            userId = user['user_id']
            email = user['email']
            secClass = 'class="secondary-content light-blue-text '
            secClass += 'text-darken-4 modal-trigger" '
            secHref = 'href="#editUserModal" '
            secOnClick = 'onclick="modalPop(\'' + userId + '\')"'
            lockIconClass = '"red-text text-darken-4 fas fa-lock fa-fw"'
            html += '''
                <li class="collection-item avatar">
                    <ul>
                        <li>
                            <h6 class="truncate">
                                <i class="''' + iconClass + '''"></i>
                                <span class="title">
                                    ''' + userId + '''
                                </span>
                            </h6>
                        </li>
                        <li>
                            <h6 class="truncate">
                                <a href="mailto:''' + email + '''">
                                    <i class="fas fa-envelope fa-fw"></i>
                                    <span class="title">
                                        ''' + email + '''
                                    </span>
                                </a>
                            </h6>
                        </li>
                    </ul>
                    <a ''' + secClass + secHref + secOnClick + '>'
            if (user['locked']):
                html += '''
                        <i class=''' + lockIconClass + '''></i>'''
            else:
                html += '''
                        <i class="fas fa-unlock fa-fw"></i>'''
            html += '''
                        <i class="fas fa-user-edit"></i>
                    </a>
                </li>'''
    else:
        html += '''
                <li class="collection-item avatar search-no-results">
                    <h6 class="truncate">
                        <i class="fas fa-info fa-fw"></i>
                        <span class="title">No Results.</span>
                    </h6>
                </li>'''
    html += '''
            </ul>
    '''

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
def buildQuizHtml(quiz_data):
    html = '''
    <ul class="collection">'''
    for quiz in quiz_data:
        secUrlClass = 'class="light-blue-text text-darken-4" '
        secHrefEdit = 'href="/edit_quiz?&id=' + quiz['id'] + '"'
        secHrefView = 'href="/view_quiz?&id=' + quiz['id'] + '"'
        html += '''
            <li class="collection-item avatar light-blue-text text-darken-4">
                <h6>
                    <i class="fas ''' + quiz['category_icon']['class']
        html += ''' fa-fw"></i>
                    <span>''' + quiz['title'] + '''</span>
                </h6>
                <div class="secondary-content light-blue-text text-darken-4">
                    <a ''' + secUrlClass + secHrefView + '''>
                        <i class="fas fa-eye"></i>
                    </a>
                    <a ''' + secUrlClass + secHrefEdit + '''>
                        <i class="fas fa-edit"></i>
                    </a>
                </div>
            </li>
        '''
    html += '</ul>'

    return html


# Quiz Search
# Return batch of 10 quizzes for provided search criteria for current user
@app.route("/quizSearch")
def quizSearch():
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)
    if auth_state['auth']:
        print(auth_state['auth'])
        print(auth_state['reason'])
        page = request.args.get('page')
        if (page == 'undefined'):
            page = 1
        else:
            page = int(page)
        searchStr = request.args.get('searchStr')
        if (searchStr == 'undefined'):
            searchStr = '*'
        category = request.args.get('category')
        limit = 10
        skip = (page * limit) - limit

        user_quiz_query = [{
                    "$search": {
                        "wildcard": {
                            "query": searchStr,
                            "path": ["title"],
                            "allowAnalyzedField": True
                        }
                    }
                }, {
                    '$match': {
                        'author_id': auth_state['id']
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
                        'category_details.category': category
                    }
                }, {
                    '$facet': {
                        'results': [{
                            '$project': {
                                '_id': {
                                    '$toString': "$_id"
                                },
                                'title': 1,
                                'category_details.category': 1,
                                'category_details.category_icon': 1
                            }
                        }, {
                            '$sort': {
                                 'title': 1
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

        if (category == 'undefined' or category == 'All'):
            user_quiz_query.pop(3)
        quiz_data = list(mongo.db.quizzes.aggregate(user_quiz_query))
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
        print(total_pages)
        quizzes = []
        for quiz in quiz_data[0]['results']:
            quizzes.append({
                'id': quiz['_id'],
                'title': quiz['title'],
                'category': quiz['category_details'][0]['category'],
                'category_icon': quiz['category_details'][0]['category_icon']

            })
        html = buildQuizHtml(quizzes)

        results = {
            'request': {
                'quizSearch': searchStr,
                'currentPage': page,
                'totalPages': total_pages
            },
            'total_results': total_quizzes,
            'type': 'quizSearch',
            'html': html,
            'quiz_data': quizzes
        }

        return results


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
    return redirect(url_for("home"))


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
    return redirect(url_for("home"))


@app.route("/new_quiz", methods=["GET", "POST"])
def new_quiz():
    if 'user' not in session:
        return redirect(url_for("login"))

    if request.method == "POST":

        # Create Quiz
        author_id = mongo.db.users.find_one(
                {'user_id': session['user'].lower()},
                {'_id': 1}
        )['_id']

        quiz_category = request.form.get('quizCategory')
        category_id = mongo.db.categories.find_one(
            {'category': quiz_category},
            {'_id': 1}
        )['_id']

        create_quiz = {
            'author_id': author_id,
            'date': datetime.datetime.now(),
            'title': request.form.get('quiz_title'),
            'category_id': category_id,
            'public': False
        }
        mongo.db.quizzes.insert_one(create_quiz)

        quiz_id = mongo.db.quizzes.find_one(
            {'author_id': create_quiz['author_id'],
                'title': create_quiz['title']},
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
            if (quiz_category == 'general knowledge'):
                round_category_id = mongo.db.categories.find_one(
                    {'category': request.form.get('roundCategory_' + rId)},
                    {'_id': 1}
                )['_id']
            else:
                round_category_id = category_id

            create_round = {
                'quiz_id': quiz_id,
                'round_num': int(rId),
                'title': request.form.get('round_title_' + rId),
                'author_id': author_id,
                'date': create_quiz['date'],
                'category_id': round_category_id,
                'public': False
            }

            mongo.db.rounds.insert_one(create_round)

            round_id = mongo.db.rounds.find_one(
                {'author_id': create_round['author_id'],
                    'quiz_id': create_round['quiz_id'],
                    'title': create_round['title']},
                {'_id': 1}
            )['_id']

            mongo.db.rounds.update_one(
                {'_id': round_id},
                {'$set': {'copy_of': round_id}}
            )

            # Create Questions
            # Expand to handle multiple choice questions
            question_count = int(request.form.get('questionCount_' + rId)) + 1
            for qId in range(1, question_count):
                qId = str(qId)

                create_question = {
                    'author_id': author_id,
                    'date': create_quiz['date'],
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

                multiple_choice = request.form.get(
                    'quizMulti_' + rId + '_' + qId
                )

                # Massage multiple_choice value into boolean
                if multiple_choice is None:
                    multiple_choice = False
                    create_question['answer_text'] = request.form.get(
                            'answer_' + rId + '_' + qId)
                    create_question['answer_img_url'] = request.form.get(
                            'a_img_' + rId + '_' + qId)

                if multiple_choice == 'on':
                    multiple_choice = True

                create_question['multiple_choice'] = multiple_choice
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

                        if correct is None:
                            correct = False

                        if correct == 'on':
                            correct = True

                        multi_array.append({
                            'option_num': int(multi),
                            'answer_text': answer_text,
                            'correct': correct,
                            'answer_img_url': answer_url
                        })

                    create_question['multiple_choice_options'] = multi_array

                mongo.db.questions.insert_one(create_question)

                question_id = mongo.db.questions.find_one(
                    {'author_id': create_question['author_id'],
                        'round_id': create_question['round_id'],
                        'question_text': create_question['question_text']},
                    {'_id': 1}
                )['_id']

                mongo.db.questions.update_one(
                    {'_id': question_id},
                    {'$set': {'copy_of': round_id}}
                )

    query = [{
        '$project': {
            '_id': 0,

        }
    }]
    category_data = list(mongo.db.categories.aggregate(query))
    return render_template("new_quiz.html", quiz_categories=category_data)


if __name__ == "__main__":
    app.run(host=os.environ.get("IP"),
            port=int(os.environ.get("PORT")),
            debug=True)
