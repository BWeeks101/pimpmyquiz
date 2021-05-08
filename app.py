# Imports
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

# App defaults
app = Flask(__name__)
app.config["MONGO_DBNAME"] = os.environ.get("MONGO_DBNAME")
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
app.secret_key = os.environ.get("SECRET_KEY")
mongo = PyMongo(app)


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
    # User not logged in, so return false
    if 'user' not in session:
        return {'auth': False, 'reason': 'Not Logged In'}
    else:
        # Is the user a member of an admin role?
        is_admin = mongo.db.users.find_one(
            {'user_id': session['user'].lower()},
            {'_id': 1, 'role_id': 1})
        uid = is_admin['_id']  # Get the user _id
        role = mongo.db.user_roles.find_one(
            {'_id': ObjectId(is_admin['role_id'])})  # Get the role _id
        is_admin = mongo.db.role_groups.find_one(
            {'_id': ObjectId(role['role_group_id'])})  # Get the role group _id

        # If the user is a member of the admin group...
        if is_admin['role_group'] == 'Administrators Group':
            is_admin = True  # is_admin is true
        else:
            is_admin = False  # Otherwise is_admin is false

        role = role['role']  # Get the role

        # Define auth_vals object
        auth_vals = {'auth': True, 'is_admin': is_admin, 'role': role}

        # Define auth as false, score as 0
        auth = False
        score = 0

        # Score for authorisation success = number of auth_criteria keys
        score_target = len(auth_criteria.keys())

        # Iterate over auth_criteria
        for key in auth_criteria.keys():
            # If the criteria key value matches the vals key value...
            if (auth_criteria[key] == auth_vals[key]):
                score += 1  # Increase the score by 1
            elif (type(auth_criteria[key]) is list and key == 'role'):
                # Otherwise if the criteria key is a list, and is 'role'
                # Iterate over the roles comparing with the vals 'role' key
                for auth_role in auth_criteria[key]:
                    if auth_role == auth_vals[key]:  # If the key values match
                        score += 1  # Increase the score by 1 and break
                        break

        # If the score matches the score target, user is authorised
        if (score == score_target):
            auth = True

        # Return the authorisation object
        return {'auth': auth, 'id': uid, 'reason': auth_vals}


# root route!
# Redirect the user to an appropriate landing page
@app.route("/")
def landing():
    # Check that the user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If the user is authorised...
    if auth_state['auth']:
        # Redirect the user to their 'my_quizzes' page
        return redirect(url_for("my_quizzes"))

    # Otherwise redirect them to the global 'quiz_search' page
    return redirect(url_for("quiz_search"))


# Show the user their own quizzes
# Access restricted to logged in users
@app.route("/my_quizzes")
def my_quizzes():
    # Check that the user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If the user is logged in...
    if auth_state['auth']:

        # Call getCategories() to pass a list of categories to the template
        categories = getCategories()

        # Render the 'my_quizzes' template, passing the category list
        return render_template("my_quizzes.html", categories=categories)

    # Otherwise display a flash message then redirect to 'login'
    flash("Please log in to view your quizzes")
    return redirect(url_for("login"))


# Show the user the global quiz_search page
@app.route("/quiz_search")
def quiz_search():
    # Call getCategories() to pass a list of categories to the template
    categories = getCategories()

    # Render the 'quiz_search' template, passing the category list
    return render_template("quiz_search.html", categories=categories)


# Register a new user
@app.route("/register", methods=["GET", "POST"])
def register():
    # Form submission handler
    if request.method == "POST":
        # check if username exists in db
        user_validated = validateUserId(request.form.get("user_id").lower())

        # if username already exists, display a flash message and redirect
        # to the register page
        if not user_validated:
            flash("Username already exists")
            return redirect(url_for("register"))

        # Get the user role id
        user_role_id = (mongo.db.user_roles.find_one(
            {'role': 'User'},
            {'_id': 1}
        ))['_id']

        # Create a registration object
        register = {
            "role_id": ObjectId(user_role_id),
            "user_id": request.form.get("user_id").lower(),
            "pwd": generate_password_hash(request.form.get("pwd")),
            "email": request.form.get("email").lower(),
            "locked": False
        }

        # Insert the object into the users document collection
        mongo.db.users.insert_one(register)

        # Put the new user into 'session' cookie
        session["user"] = request.form.get("user_id").lower()

        # Display a flash message, then redirect to 'my_quizzes'
        flash("Registration Successful")
        return redirect(url_for("my_quizzes", username=session["user"]))

    # render the 'register' template
    return render_template("register.html")


# log a user in
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # check if username exists in db
        existing_user = mongo.db.users.find_one(
            {"user_id": request.form.get("user_id").lower()},
            {"_id": 0, "user_id": 1, "pwd": 1, "role_id": 1, "locked": 1})

        # get the users role
        user_role = mongo.db.user_roles.find_one(
            {"_id": ObjectId(existing_user['role_id'])},
            {"_id": 0, "role": 1})

        # If the user exists
        if existing_user:
            # ensure hashed password matches user input
            if check_password_hash(
                    existing_user["pwd"], request.form.get("pwd")):

                # if account is locked, display a flash message and redirect
                # to the login page
                if existing_user["locked"] is True:
                    flash("Your account is currently locked.")
                    return redirect(url_for("login"))

                # Add the user id and role to session
                session["user"] = request.form.get("user_id").lower()
                session["user_role"] = user_role['role'].lower()

                # Display a flash message and redirect to 'my_quizzes'
                flash("Welcome, {}".format(request.form.get("user_id")))
                return redirect(url_for(
                    "my_quizzes", username=session["user"]))
            else:
                # invalid username/password match so display a flash message
                # and redirect to the login page
                flash("Incorrect Username and/or Password")
                return redirect(url_for("login"))
        else:
            # username doesn't exist, so display a flash message and redirect
            # to the login page
            flash("Incorrect Username and/or Password")
            return redirect(url_for("login"))

    # render the 'login' template
    return render_template("login.html")


# log a user out
@app.route("/logout")
def logout():
    # if the user is logged in
    if 'user' in session:
        # remove user from session cookies and display a flash message
        flash("You have been logged out")
        session.pop("user")

    # redirect to the login page
    return redirect(url_for("login"))


# User Administration console
# Access restricted to Global Admin and User Account Admin role members
@app.route("/admin_users", methods=["GET", "POST"])
def admin_users():
    # Check that user is logged in, and a global or user account admin
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)

    # If the user is authorised
    if auth_state['auth']:
        # Edit User Form Submission
        if request.method == "POST":
            # Get the original and new user id values
            original_user_id = request.form.get("orig_user_id").lower()
            new_user_id = request.form.get("user_id").lower()

            # check if new username exists in db
            user_validated = validateUserId(new_user_id, original_user_id)

            # If the new username exists, display a flash message and redirect
            # to the admin_users page
            if not user_validated:
                flash("New Username already exists - User not updated")
                return redirect(url_for("admin_users"))

            # Get the existing user object _id
            existing_user = mongo.db.users.find_one(
                {"user_id": original_user_id},
                {"_id": 1})

            # Define the update_user object
            update_user = {
                "user_id": request.form.get("user_id").lower(),
                "email": request.form.get("email").lower(),
                "locked": request.form.get("locked")
            }

            # Massage locked value into boolean
            update_user['locked'] = transposeWithBoolean(update_user['locked'])

            # Get the user role object _id
            role = mongo.db.user_roles.find_one(
                {"role": request.form.get("role")},
                {"_id": 1})

            # Only allow a Global Admin to add users to the Global Admin or
            # User Account Admin roles
            if (request.form.get("role") == "Global Admin" or
                    request.form.get("role") == "User Account Admin"):
                # If the user is a member of the Global Admin role...
                if auth_state['reason']['role'] == "Global Admin":
                    # Add the role object _id to the update_user object
                    update_user["role_id"] = ObjectId(role["_id"])
                else:
                    # Otherwise display a flash message then continue
                    flash("Not Authorised to Add User to " +
                          request.form.get("role") + " Role")
            else:
                # role is not global or user account admin, so add the role
                # object _id to to the update_user object
                update_user["role_id"] = ObjectId(role["_id"])

            # If the form includes a password value, generate a password hash
            # and add it to the update_user object
            if request.form.get("pwd"):
                update_user["pwd"] = generate_password_hash(
                    request.form.get("pwd"))

            # Locate the user document within the users document collection and
            # update it
            mongo.db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_user})

            # Display a flash message and redirect to the admin_users page
            flash("User Details Updated")
            return redirect(url_for("admin_users"))

        # GET Method
        # Get the global_admin role object _id
        global_admin = mongo.db.user_roles.find_one(
            {"role": "Global Admin"},
            {"_id": 1})['_id']

        # Get the user_account_admin role object _id
        user_account_admin = mongo.db.user_roles.find_one(
            {"role": "User Account Admin"},
            {"_id": 1})['_id']

        # Build the user_data_query
        user_data_query = [{
                '$match': {
                    'role_id': {
                        '$nin': [
                            # ignore global_admin, user_account_admin members
                            ObjectId(global_admin),
                            ObjectId(user_account_admin)
                        ]
                    }
                }
            }, {
                # return user_role data for the users role
                '$lookup': {
                    'from': 'user_roles',
                    'localField': 'role_id',
                    'foreignField': '_id',
                    'as': 'role_details'
                }
            }, {
                # merge user role data back into the parent result set
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
                # return role_group data for the users role group
                '$lookup': {
                    'from': 'role_groups',
                    'localField': 'role_group_id',
                    'foreignField': '_id',
                    'as': 'role_group_details'
                }
            }, {
                # merge role group data back into the parent result set
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
                # remove unnecessary cols from the results
                '$project': {
                    'role_group_details': 0,
                    'role_details': 0,
                    '_id': 0,
                    'role_group_id': 0,
                    'role_id': 0,
                    'pwd': 0
                }
            }, {
                # sort by role group, role, user_id
                '$sort': {
                    'role_group': 1,
                    'role': 1,
                    'user_id': 1
                }
            }, {
                # return 3 result facets
                '$facet': {
                    # group results by role
                    'roles': [{
                        '$group': {
                            '_id': {
                                'role': '$role',  # role name
                                'group': '$role_group',  # role group name
                                'icon': '$role_icon',  # role icon
                                'desc': '$role_desc'  # role description
                            },
                            # count results per role
                            'member_count': {
                                '$sum': 1
                            }
                        }
                    }, {
                        # sort by role name
                        '$sort': {
                            '_id.role': 1
                        }
                    }],
                    # group results by role group
                    'groups': [{
                        '$group': {
                            '_id': {
                                'group': '$role_group',  # group name
                                'icon': '$role_group_icon'  # group icon
                            },
                            # count results per group
                            'member_count': {
                                '$sum': 1
                            }
                        }
                    }, {
                        # sort by group name
                        '$sort': {
                            '_id.group': 1
                        }
                    }],
                    # total result count
                    'total_users': [{
                        '$group': {
                            '_id': 'null',
                            # count all results
                            'total': {
                                '$sum': 1
                            }
                        }
                    }]
                }
            }]

        # If user is Global Admin, remove the Global Admin and
        # User Account Admin role restrictions from the query list
        if auth_state['reason']['role'] == 'Global Admin':
            user_data_query.pop(0)

        # return the users query results as a list
        user_data = list(mongo.db.users.aggregate(user_data_query))

        # define result lists
        user_roles = list()
        role_groups = list()

        # return the total user count from user query results
        total_users = int(user_data[0]['total_users'][0]['total'])

        # Iterate over roles data from user query results, and add the objects
        # to the user_roles list
        for role in user_data[0]['roles']:
            user_roles.append({
                'role': role['_id']['role'],
                'role_group': role['_id']['group'],
                'role_icon': role['_id']['icon'],
                'role_desc': role['_id']['desc'],
                'member_count': role['member_count']
            })

        # Iterate over group data from user query results, and add the objects
        # to the role_groups list
        for group in user_data[0]['groups']:
            role_groups.append({
                'role_group': group['_id']['group'],
                'role_group_icon': group['_id']['icon'],
                'member_count': group['member_count']
            })

        # render the 'admin_users' template, passing the user_roles and
        # role_groups lists
        return render_template(
            "admin_users.html",
            user_roles=user_roles,
            role_groups=role_groups
        )

    # User is not authorised.  Display a flash message and redirect to the
    # my_quizzes page
    flash("Permission Denied")
    return redirect(url_for("my_quizzes"))


# Return user, role membership and role group membership counts
# Access restricted to Global Admin and User Account Admin.
def getUserTotals():
    # Check that user is logged in, and a global or user account admin
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:
        # Get the global_admin role object _id
        global_admin = mongo.db.user_roles.find_one(
            {"role": "Global Admin"},
            {"_id": 1})['_id']

        # Get the user_account_admin role object _id
        user_account_admin = mongo.db.user_roles.find_one(
            {"role": "User Account Admin"},
            {"_id": 1})['_id']

        # Build the query
        query = [{
            '$match': {
                'role_id': {
                    '$nin': [
                        # ignore global_admin, user_account_admin members
                        ObjectId(global_admin),
                        ObjectId(user_account_admin)
                    ]
                }
            }
        }, {
            # return user_role data for the users role
            '$lookup': {
                'from': 'user_roles',
                'localField': 'role_id',
                'foreignField': '_id',
                'as': 'role_details'
            }
        }, {
            # merge user role data back into the parent result set
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
            # return role_group data for the users role group
            '$lookup': {
                'from': 'role_groups',
                'localField': 'role_group_id',
                'foreignField': '_id',
                'as': 'role_group_details'
            }
        }, {
            # merge role group data back into the parent result set
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
            # remove unnecessary cols from the results
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
            # sort by role group, role, user_id
            '$sort': {
                'role_group': 1,
                'role': 1,
                'user_id': 1
            }
        }, {
            # return 3 result facets
            '$facet': {
                # group results by role
                'roles': [{
                    '$group': {
                        '_id': {
                            'role': '$role',  # role name
                            'group': '$role_group',  # role group name
                            'desc': '$role_desc'  # role description
                        },
                        # count results per role
                        'member_count': {
                            '$sum': 1
                        }
                    }
                }, {
                    # sort by role name
                    '$sort': {
                        '_id.role': 1
                    }
                }],
                # group results by role group
                'groups': [{
                    '$group': {
                        '_id': {
                            'group': '$role_group'  # group name
                        },
                        # count results per group
                        'member_count': {
                            '$sum': 1
                        }
                    }
                }, {
                    # sort by group name
                    '$sort': {
                        '_id.group': 1
                    }
                }],
                # total user count
                'total_users': [{
                    '$group': {
                        '_id': 'null',
                        # count all results
                        'total': {
                            '$sum': 1
                        }
                    }
                }]
            }
        }]

        # If user is Global Admin, remove the Global Admin and User Account
        # Admin role restrictions from the query
        if auth_state['reason']['role'] == 'Global Admin':
            query.pop(0)

        # return the query results as a list
        data = list(mongo.db.users.aggregate(query))[0]

        # define result lists
        user_roles = list()
        role_groups = list()

        # Iterate over roles data from query results, and add the objects
        # to the user_roles list
        for role in data['roles']:
            user_roles.append({
                'role': role['_id']['role'],
                'role_group': role['_id']['group'],
                'role_desc': role['_id']['desc'],
                'member_count': role['member_count']
            })

        # Iterate over group data from query results, and add the objects
        # to the role_groups list
        for group in data['groups']:
            role_groups.append({
                'role_group': group['_id']['group'],
                'member_count': group['member_count']
            })

        # Define results object
        results = {
            'user_roles': user_roles,  # user_roles list
            'role_groups': role_groups,  # role_groups list
            'total_users': data['total_users'][0]['total']  # total user count
        }

        # return the results object
        return results

    # Not authorised
    return False


# Returns formatted HTML output for user data sets
# Requires:
#   user_data: user data list returned by getUsers() and userSearch()
def buildUserHtml(user_data):
    # define base html string
    html = '''
    <ul class="collection user-search-results">'''

    # if the user_data param contains a list...
    if user_data:
        # Iterate over the user_data list
        for user in user_data:
            # define strings
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
            editDataUser = 'data-user="' + userId + '"'
            editLink = editClass + editHref + editTip + editDataUser
            lockIconClass = 'class="red-text text-darken-4 fas fa-lock fa-fw"'
            lockIcon = lockIconClass + '></i'
            unlockIconClass = 'class="fas fa-unlock fa-fw"'
            unlockIcon = unlockIconClass + '></i'

            # Append data to html string
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
        # no list, so append 'no results' elements to the html string
        html += '''
        <li class="collection-item search-no-results '''
        html += 'light-blue-text text-darken-4 ' + '''center-align">
            <h5>
                <i class="fas fa-info fa-fw"></i>
                <span class="title">No Results.</span>
            </h5>
        </li>'''

    # finalise the html string
    html += '''
    </ul>\n'''

    # return the html string
    return html


# Returns list of categories
def getCategories():
    # Return all fields except the object _id
    categories_query = [{
        "$project": {
            "_id": 0
        }
    }]

    # return the results of the query as a list
    return list(mongo.db.categories.aggregate(categories_query))


# Returns formatted HTML output for quiz data sets
# Requires:
#   quiz_data: quiz data list returned by processQuizQueryResults()
#   user_role: role of user requesting the results
def buildQuizHtml(quiz_data, user_role):
    # define base html string
    html = '''
    <ul class="collection quiz-search-results">'''

    # if the quiz_data param contains a list...
    if quiz_data:
        # iterate over the quiz_data list
        for quiz in quiz_data:
            # define strings
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
            secHrefQuiz = 'href="/quiz_sheet?&id=' + quiz['id'] + '" '
            secTargetQuiz = 'target="_blank"'
            secQuizSheet = secUrlClass + secTipQuiz
            secQuizSheet += secHrefQuiz + secTargetQuiz
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

            # append data to html string
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

            # if user is logged in, enable quiz copy links
            if ('user' in session):
                html += '''
                    <a ''' + secCopyQuiz + '''href="#!">
                        <i class="fas fa-copy fa-fw"></i>
                    </a>'''
            else:
                # Otherwise return a span instead of an a element
                html += '''
                    <span class="grey-text">
                        <i class="fas fa-copy fa-fw"></i>
                    </span>'''

            # if user is logged in and the author, or a global or content admin
            # enable the edit and delete quiz links
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
                # Otherwise return spans instead of a elements
                html += '''
                    <span class="grey-text">
                        <i class="fas fa-edit fa-fw"></i>
                    </span>
                    <span class="grey-text">
                        <i class="fas fa-trash fa-fw"></i>
                    </span>'''

            # close final tags for this quiz_data list entry
            html += '''
                </div>
            </div>
        </li>'''
    else:
        # no list, so append 'no results' elements to the html string
        html += '''
        <li class="collection-item search-no-results '''
        html += 'light-blue-text text-darken-4 ' + '''center-align">
            <h5>
                <i class="fas fa-info fa-fw"></i>
                <span class="title">No Results.</span>
            </h5>
        </li>'''

    # finalise the html string
    html += '''
    </ul>\n'''

    # return the html string
    return html


# Returns quiz query parameters
# Requires:
#   params: Object with the following parameters:
#       searchType: string representing the type of search
#       userId: OPTIONAL. object _id of a user to filter results by
#       page: number of the page of results to return
#       searchStr: search string
#       category: string representing the category to filter results by
#       limit: number of results to return
#       skip: number of results to skip
def buildQuizQuery(params):
    # if no userId parameter, add it with a value of None
    if ('userId' not in params):
        params['userId'] = None

    # Build the query
    query = [{
        # wildcard search query.  searchStr vs title field
        "$search": {
            "wildcard": {
                "query": params['searchStr'],
                "path": ["title"],
                "allowAnalyzedField": True
            }
        }
    }, {
        # Filter results by userId
        '$match': {
            'author_id': params['userId']
        }
    }, {
        # return category data
        '$lookup': {
            'from': 'categories',
            'localField': 'category_id',
            'foreignField': '_id',
            'as': 'category_details'
        }
    }, {
        # Filter results by category
        '$match': {
            'category_details.category': params['category']
        }
    }, {
        # return user data
        '$lookup': {
            'from': 'users',
            'localField': 'author_id',
            'foreignField': '_id',
            'as': 'author_details'
        }
    }, {
        # return 2 result facets
        '$facet': {
            # return quiz title, author username, quiz category and icon
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
                # sort by quiz title
                '$sort': {
                        'title': 1
                }
            }, {
                # skip this number of results before returning
                '$skip': params['skip']
            }, {
                # return this number of results after skipping
                '$limit': params['limit']
            }],
            # total result count
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
    # define category filter position within query list
    category_index = 3

    # if the search type is global..
    if (params['searchType'] == 'globalQuizSearch'):
        query.pop(1)  # remove the userId filter
        category_index = 2  # adjust the category_index

    # If the category is All or undefined, remove the category filter
    if (params['category'] == 'undefined' or params['category'] == 'All'):
        query.pop(category_index)

    # return the query list
    return query


# Formats quiz query results for return to client
# Requires:
#   params: Object with the following parameters:
#       searchType: string representing the type of search
#       user_role: role of the user requesting the search
#       quiz_data: quiz data returned by executing a mongoDB aggregate
#                  utilising a query built by buildQuizQuery()
#       limit: number of results to return
#       searchStr: search string
#       page: number of the page of results to return
def processQuizQueryResults(params):
    # get quiz_data
    quiz_data = params['quiz_data']

    # get page
    page = params['page']

    # get limit
    limit = params['limit']

    # define total_quizzes
    total_quizzes = 0

    # if quiz_data contains total_results, update total_quizzes
    if quiz_data[0]['total_results']:
        total_quizzes = int(quiz_data[0]['total_results'][0]['total'])

    # Calculate total pages based on:
    #   total quizzes / number of returned records
    #       total_quizzes // limit
    #   divide number of quizzes by the page limit, returning an integer
    #   (floor division)
    #       total_quizzes % limit > 0
    #   if remainder of total_quizzes / limit is greater than 0, add 1
    #   (modulus operation, then if result > 0 return 1 (true))
    total_pages = (total_quizzes // limit) + (total_quizzes % limit > 0)

    # If the requested page is > total_pages, then page = total_pages
    if (page > total_pages):
        page = total_pages

    # iterate over quiz_data results, and populate the quizzes list
    quizzes = []
    for quiz in quiz_data[0]['results']:
        quizzes.append({
            'id': quiz['_id'],
            'title': quiz['title'],
            'author': quiz['author_details'][0]['user_id'],
            'category': quiz['category_details'][0]['category'],
            'category_icon': quiz['category_details'][0]['category_icon']
        })

    # populate html string by passing quizzes and user_role to buildQuizHtml()
    html = buildQuizHtml(quizzes, params['user_role'])

    # build results object
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

    # return results object
    return results


# My Quiz Search
# Return batch of 10 quizzes for provided search criteria for current user
@app.route("/myQuizSearch")
def myQuizSearch():
    # Check that user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:
        # Get page
        page = request.args.get('page')

        # If page is undefined/None, then set it to 1
        if (page == 'undefined' or page is None):
            page = 1
        else:
            # Otherwise convert the value to int
            page = int(page)

        # Get search string
        searchStr = request.args.get('searchStr')

        # If search string is undefined/None, set it to * wildcard
        if (searchStr == 'undefined' or searchStr is None):
            searchStr = '*'

        # Get category
        category = request.args.get('category')

        # If category is undefined/None, set it to All
        if (category == 'undefined' or category is None):
            category = 'All'

        # Set limit to 10
        limit = 10

        # Number of records to skip = (page x limit) - limit
        skip = (page * limit) - limit

        # Call buildQuizQuery()
        user_quiz_query = buildQuizQuery({
            'searchType': 'myQuizSearch',
            'userId': auth_state['id'],
            'page': page,
            'searchStr': searchStr,
            'category': category,
            'limit': limit,
            'skip': skip
        })

        # get search results list
        quiz_data = list(mongo.db.quizzes.aggregate(user_quiz_query))

        # Call processQuizQueryResults() to process search results
        results = processQuizQueryResults({
            'searchType': 'myQuizSearch',
            'user_role': auth_state['reason']['role'],
            'quiz_data': quiz_data,
            'limit': limit,
            'searchStr': searchStr,
            'page': page
        })

        # return results
        return results

    # Otherwise display flash message and redirect to login page
    flash("Permission Denied")
    return redirect(url_for("login"))


# Global Quiz Search
# Return batch of 10 quizzes for provided search criteria
@app.route("/globalQuizSearch")
def globalQuizSearch():
    # Declare user_role as None
    user_role = None

    # check that user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # if user is authorised...
    if auth_state['auth']:
        # get the users role
        user_role = auth_state['reason']['role']

    # Get page
    page = request.args.get('page')

    # If page is undefined/None, then set it to 1
    if (page == 'undefined' or page is None):
        page = 1
    else:
        # Otherwise convert the value to int
        page = int(page)

    # Get search string
    searchStr = request.args.get('searchStr')

    # If search string is undefined/None, set it to * wildcard
    if (searchStr == 'undefined' or searchStr is None):
        searchStr = '*'

    # Get category
    category = request.args.get('category')

    # If category is undefined/None, set it to All
    if (category == 'undefined' or category is None):
        category = 'All'

    # Set limit to 10
    limit = 10

    # Number of records to skip = (page x limit) - limit
    skip = (page * limit) - limit

    # Call buildQuizQuery()
    user_quiz_query = buildQuizQuery({
        'searchType': 'globalQuizSearch',
        'page': page,
        'searchStr': searchStr,
        'category': category,
        'limit': limit,
        'skip': skip
    })

    # get search results list
    quiz_data = list(mongo.db.quizzes.aggregate(user_quiz_query))

    # Call processQuizQueryResults() to process search results
    results = processQuizQueryResults({
        'searchType': 'globalQuizSearch',
        'user_role': user_role,
        'quiz_data': quiz_data,
        'limit': limit,
        'searchStr': searchStr,
        'page': page
    })

    # return results
    return results


# Delete Quiz
# Delete quiz and associated rounds and questions
@app.route("/delete_quiz")
def deleteQuiz():
    # Check that user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:
        # Get quiz object _id
        quiz_id = ObjectId(request.args.get('id'))

        # Get user based on user name
        user_id = mongo.db.users.find_one({'user_id': session['user']})['_id']

        # Get quiz based on quiz object _id
        quiz = mongo.db.quizzes.find_one({"_id": quiz_id})

        # If the user is the quiz author, or a global or content admin...
        if ((quiz['author_id'] == user_id) or
                (auth_state['reason']['role'] == 'Global Admin' or
                    auth_state['reason']['role'] == 'Content Admin')):
            # find and delete the quiz based on quiz object _id
            mongo.db.quizzes.find_one_and_delete({"_id": quiz_id})

            # return list of rounds associated with deleted quiz
            rounds = list(mongo.db.rounds.find({"quiz_id": quiz_id}))

            # delete rounds associated with deleted quiz
            mongo.db.rounds.delete_many({"quiz_id": quiz_id})

            # Iterate over the rounds list
            for round in rounds:
                # delete questions associated with each round in the list
                mongo.db.questions.delete_many({"round_id": round['_id']})

            # redirect to the referrer url
            return redirect(request.referrer)

        # Otherwise user is not authorised, so display a flash message and
        # redirect to the referrer url
        flash("Permission Denied")
        return redirect(request.referrer)

    # User is not logged in, so display a flash message and redirect to the
    # login page
    flash("Permission Denied")
    return redirect(url_for("login"))


# Build View Quiz Data Set
# Requires:
#   params: Object with the following parameters:
#       quiz_id: quiz object _id
#       show_answers: Boolean. If true, answer data is returned.
def buildViewQuizDataSet(params):
    # Return quiz title, category object _id and author object _id
    quiz = mongo.db.quizzes.find_one({
        '_id': params['quiz_id']
    }, {
        # '_id': 1,
        'title': 1,
        'category_id': 1,
        'author_id': 1
    })

    # Convert quiz object _id to string
    quiz['_id'] = str(quiz['_id'])

    # Get quiz category
    category = mongo.db.categories.find_one({
        '_id': quiz['category_id']
    }, {
        '_id': 0
    })

    # Add category data to quiz object
    quiz['category'] = category['category']
    quiz['category_icon'] = category['category_icon']

    # remove category object _id from quiz object
    quiz.pop('category_id')

    # Add quiz author username to quiz object
    quiz['author'] = mongo.db.users.find_one({
        '_id': quiz['author_id']
    }, {
        '_id': 0,
        'user_id': 1
    })['user_id']

    # remove author object _id from quiz object
    quiz.pop('author_id')

    # Add quiz round list to quiz object
    # returns round number, title, and category object _id sorted by round
    # number
    quiz['rounds'] = list(mongo.db.rounds.find({
        'quiz_id': params['quiz_id']
    }, {
        'round_num': 1,
        'title': 1,
        'category_id': 1
    }).sort('round_num'))

    # Iterate over round list
    for round in quiz['rounds']:
        # for each round, get the category
        category = mongo.db.categories.find_one({
            '_id': round['category_id']
        }, {
            '_id': 0
        })

        # remove the category object _id from the round
        round.pop('category_id')

        # Add the category and icon to the round
        round['category'] = category['category']
        round['category_icon'] = category['category_icon']

        # If show_answers is true...
        if (params['show_answers']):
            # Add round question list to round
            # returns question object _id, question number, question text,
            # question image url, answer text, answer image url, multiple
            # choice, multiple choice option count, and any multiple choice
            # options, sorted by question number
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
            # Otherwise add round question list to round
            # returns question object _id, question number, question text,
            # question image url, multiple choice, multiple choice option
            # count, options number, options answer text, and options answer
            # image url, sorted by question number
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

        # Convert the round object _id to a string
        round['_id'] = str(round['_id'])

        # Declare isPictureRound as True
        isPictureRound = True

        # If a round has a single question, it cannot be a picture round
        if len(round['questions']) < 2:
            isPictureRound = False

        # Iterate over each question in the round
        for question in round['questions']:
            # Convert the question object _id to a string
            question['_id'] = str(question['_id'])

            # if isPictureRound is true...
            if isPictureRound is True:
                # If the length of a question image url is > 0, the length of
                # a question is > 0 or if the question is multiple choice, then
                # this cannot be a picture round
                if (len(question['question_img_url']) == 0 or
                        len(question['question_text']) > 0 or
                        question['multiple_choice'] is True):
                    isPictureRound = False

        # Add isPictureRound to the round object
        round['isPictureRound'] = isPictureRound

    # return the quiz object
    return quiz


# Transpose a non-boolean returned value with a python boolean
# Requires:
#   val: value to transpose
def transposeWithBoolean(val):
    if val is None or val == 'undefined':
        val = False
    elif val == 'on':
        val = True

    return val


# Get a category object _id from a category string
# Requires:
#   category: category string
def getCategoryId(category):
    # Get category
    category_id = mongo.db.categories.find_one(
        {'category': category},
        {'_id': 1}
    )

    # If a category is found, set category_id to the object _id
    if category_id is not None:
        category_id = category_id['_id']

    # return the category object _id
    return category_id


# Create a question document
# Requires:
#   rId: round number
#   qId: question number
#   question_data: object with the following parameters:
#       author_id: user object _id
#       date: current date and time
#       round_id: parent round object _id
#       question_num: question number
#       question_text: question text
#       question_img_url: question image url
#       public: Boolean. False.  (Currently unused)
def createQuestion(rId, qId, question_data):
    # Return the value of the multiple choice checkbox
    multiple_choice = request.form.get('quizMulti_' + rId + '_' + qId)

    # Convert multiple_choice to boolean
    multiple_choice = transposeWithBoolean(multiple_choice)

    # If not multiple choice...
    if multiple_choice is False:
        # Get answer text
        question_data['answer_text'] = request.form.get(
                'answer_' + rId + '_' + qId)

        # Get answer image url
        question_data['answer_img_url'] = request.form.get(
                'a_img_' + rId + '_' + qId)

        # Set multi_count to 0
        question_data['multi_count'] = 0

        # Set multiple_choice value
        question_data['multiple_choice'] = multiple_choice

    # If multiple choice...
    if multiple_choice is True:
        # declare multi_array list
        multi_array = []

        # get multi_count + 1
        multi_count = int(request.form.get(
            'multiCount_' + rId + '_' + qId
        )) + 1

        # For each multiple choice option...
        for multi in range(1, multi_count):
            # Get the answer text
            answer_text = request.form.get(
                'answer_' + rId + '_' + qId + '_' + str(multi))

            # Get the .correct checkbox value
            correct = request.form.get(
                'correct_' + rId + '_' + qId + '_' + str(multi))

            # Get the answer image url
            answer_url = request.form.get(
                'a_img_' + rId + '_' + qId + '_' + str(multi))

            # Convert checkbox value to boolean
            correct = transposeWithBoolean(correct)

            # package the values into an option object, add an option number,
            # and append to the multi_array list
            multi_array.append({
                'option_num': int(multi),
                'answer_text': answer_text,
                'correct': correct,
                'answer_img_url': answer_url
            })

        # Add the number of multiple choice options
        question_data['multi_count'] = len(multi_array)

        # Set the multiple choice value
        question_data['multiple_choice'] = multiple_choice

        # Add the multiple choice options list
        question_data['multiple_choice_options'] = multi_array

    # Insert the question_data object as a new document in the questions
    # document collection
    mongo.db.questions.insert_one(question_data)

    # Locate the new document and return the question object _id
    question_id = mongo.db.questions.find_one(
        {'author_id': question_data['author_id'],
            'round_id': question_data['round_id'],
            'question_text': question_data['question_text']},
        {'_id': 1}
    )['_id']

    # Update the new question document with the copy_of parameter, which will
    # be equal to the question object _id (as this question is not a copy)
    mongo.db.questions.update_one(
        {'_id': question_id},
        {'$set': {'copy_of': question_id}}
    )


# Create a round document
# Requires:
#   rId: round number
#   round_data: object with the following parameters:
#       quiz_id: parent quiz object _id
#       round_num: round number
#       title: round title
#       author_id: user object _id
#       date: current date and time
#       category_id: category object _id
#       public: Boolean.  False.  (Currently unused)
def createRound(rId, round_data):
    # Insert the round_data object as a new document in the rounds document
    # collection
    mongo.db.rounds.insert_one(round_data)

    # Locate the new document and return the round object _id
    round_id = mongo.db.rounds.find_one(
        {'author_id': round_data['author_id'],
            'quiz_id': round_data['quiz_id'],
            'title': round_data['title']},
        {'_id': 1}
    )['_id']

    # Update the new round document with the copy_of parameter, which will
    # be equal to the round object _id (as this round is not a copy)
    mongo.db.rounds.update_one(
        {'_id': round_id},
        {'$set': {'copy_of': round_id}}
    )

    # Create Questions
    # Get the question count + 1
    question_count = int(request.form.get('questionCount_' + rId)) + 1

    # For each question...
    for qId in range(1, question_count):
        # Convert the qId to a string
        qId = str(qId)

        # Define a question_data object
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

        # Create the question document
        createQuestion(rId, qId, question_data)


# Create a quiz document
# Requires:
#   author_id: user object _id
def createQuiz(author_id):
    # Get the quiz category
    quiz_category = request.form.get('quizCategory')

    # Get the category object _id
    category_id = getCategoryId(quiz_category)

    # define a quiz_data object
    quiz_data = {
        'author_id': author_id,  # user object _id
        'date': datetime.datetime.now(),  # current date/time
        'title': request.form.get('quiz_title'),  # quiz title
        'category_id': category_id,  # category object _id
        'public': False  # Currently unused
    }

    # Insert the quiz_data object as a new document in the quizzes document
    # collection
    mongo.db.quizzes.insert_one(quiz_data)

    # Locate the new document and return the quiz object _id
    quiz_id = mongo.db.quizzes.find_one(
        {'author_id': quiz_data['author_id'],
            'title': quiz_data['title']},
        {'_id': 1}
    )['_id']

    # Update the new quiz document with the copy_of parameter, which will
    # be equal to the quiz object _id (as this quiz is not a copy)
    mongo.db.quizzes.update_one(
        {'_id': quiz_id},
        {'$set': {'copy_of': quiz_id}}
    )

    # Create Rounds
    # Get the round count + 1
    round_count = int(request.form.get('roundCount')) + 1

    # For each round...
    for rId in range(1, round_count):
        # Convert the rId to a string
        rId = str(rId)

        # If this is a general knowledge quiz...
        if (quiz_category.lower() == 'general knowledge'):
            # Get the category object _id for the round category
            round_category_id = getCategoryId(
                request.form.get('roundCategory_' + rId)
            )
        else:
            # Otherwise the round category object _id is equal to the quiz
            # category object _id
            round_category_id = category_id

        # define a round_data object
        round_data = {
            'quiz_id': quiz_id,
            'round_num': int(rId),
            'title': request.form.get('round_title_' + rId),
            'author_id': author_id,
            'date': quiz_data['date'],
            'category_id': round_category_id,
            'public': False
        }

        # Create the round and question documents
        createRound(rId, round_data)

    # return the quiz object _id
    return quiz_id


# Generate a 'cancel' url (used by the new_quiz and edit_quiz templates)
# Requires:
#   cancel_url: the current url
def generateCancelUrl(cancel_url):
    # if None, then use the referrer url
    if cancel_url is None:
        cancel_url = request.referrer

    # Not None, but the url contains quiz_search, then use the quiz_search url
    if cancel_url is not None and cancel_url.find('quiz_search') > -1:
        cancel_url = url_for('quiz_search')
    # Not None, but the url contains admin_users, then use the admin_users url
    elif cancel_url is not None and cancel_url.find('admin_users') > -1:
        cancel_url = url_for('admin_users')
    else:
        # Otherwise use the my_quizzes url
        cancel_url = url_for('my_quizzes')

    # return the url
    return cancel_url


# Copy Quiz for Current User
@app.route("/copy_quiz")
def copyQuiz():
    # Check user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:
        # If the request does not contain the source quiz object _id, then
        # display flash messages and redirect to the referrer
        if (request.args.get('id') == '' or request.args.get('id') is None or
                request.args.get('id') == 'undefined'):
            flash("Quiz Copy Failed")
            flash("No Original Quiz Id")
            return redirect(request.referrer)

        # Get the source quiz object _id
        quiz_id = ObjectId(request.args.get('id'))

        # Get the user object _id
        author_id = auth_state['id']

        # Return the source quiz without the copy_of, author_id or date fields
        quiz = mongo.db.quizzes.find_one({
            '_id': quiz_id
        }, {
            'copy_of': 0,
            'author_id': 0,
            'date': 0
        })

        # If no quiz is returned then display flash messages and redirect to
        # the referrer
        if quiz is None:
            flash("Quiz Copy Failed")
            flash("No Quiz Matching Original Id")
            return redirect(request.referrer)

        # Set copy_of to the source quiz object _id
        quiz['copy_of'] = quiz['_id']

        # Remove the quiz object _id field
        quiz.pop('_id')

        # Set the author_id to the user object _id
        quiz['author_id'] = author_id

        # Set the date to the current date/time
        quiz['date'] = datetime.datetime.now()

        # Set the title to the new provided title
        quiz['title'] = request.args.get('title')

        # If the quiz title is not a valid string, then set it to 'Quiz Title'
        if (quiz['title'] == '' or quiz['title'] is None or
                quiz['title'] == 'undefined'):
            quiz['title'] = 'Quiz Title'

        # validate the quiz title string
        validate_title = validateQuizTitle(quiz['title'])

        # If the quiz title fails to validate, then append the current date
        # and time to the title string rather than abort
        if validate_title is False:
            quiz['title'] = quiz['title'] + ' - ' + str(quiz['date'])

        # Insert the quiz object as a new document, and get the new object _id
        q_id = mongo.db.quizzes.insert_one(quiz).inserted_id

        # Return a list of rounds for the source quiz, omitting the quiz_id,
        # copy_of, author_id and date fields, and sorting by round number
        rounds = list(mongo.db.rounds.find({
            'quiz_id': quiz_id
        }, {
            'quiz_id': 0,
            'copy_of': 0,
            'author_id': 0,
            'date': 0
        }).sort('round_num'))

        # For each round...
        for round in rounds:
            # Return a list of questions for the round, omitting the round_id,
            # copy_if, author_id, and date fields, and sorting by question
            # number
            questions = list(mongo.db.questions.find({
                'round_id': round['_id']
            }, {
                'round_id': 0,
                'copy_of': 0,
                'author_id': 0,
                'date': 0
            }).sort('question_num'))

            # Set quiz_id to the new quiz object _id
            round['quiz_id'] = q_id

            # Set copy_of to the source round object _id
            round['copy_of'] = round['_id']

            # remove the round object _id
            round.pop('_id')

            # set the author_id to the user object _id
            round['author_id'] = author_id

            # set the date to the new quiz date/time
            round['date'] = quiz['date']

            # Insert the round object as a new document, and get the new
            # object _id
            r_id = mongo.db.rounds.insert_one(round).inserted_id

            # For each question...
            for question in questions:
                # set round_id to the new round object _id
                question['round_id'] = r_id

                # set copy_of to the original question object _id
                question['copy_of'] = question['_id']

                # remove the question object _id
                question.pop('_id')

                # set the author_id to the user object _id
                question['author_id'] = author_id

                # set the date to the new quiz date/time
                question['date'] = quiz['date']

            # Insert the question list entries as new question documents
            mongo.db.questions.insert_many(questions)

        # display a flash message and redirect to the referrer
        flash("Quiz Copied")
        return redirect(request.referrer)

    # If not logged in, redirect to the login page
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
    # Get the quiz object _id
    quiz_id = ObjectId(request.args.get('id'))

    # Set default parameter values
    params = {
        'show_answers': False,
        'quiz_id': quiz_id
    }

    # View Quiz request
    if request.endpoint == 'view_quiz':
        # set show_answers to True
        params['show_answers'] = True

        # Get the quiz data set
        quiz = buildViewQuizDataSet(params)

        # render the 'view_quiz' template, passing the quiz object
        return render_template("view_quiz.html", viewQuiz=quiz)

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

        # If user is logged in...
        if type(auth_state['reason']) != str:
            # If user is authorised...
            if auth_state['reason']['auth'] is True:
                # Get the author_id field
                author_id = mongo.db.quizzes.find_one({
                    '_id': quiz_id
                }, {
                    '_id': 0,
                    'author_id': 1
                })['author_id']
        # If user is authorised, or user is author
        if auth_state['auth'] or (
                'id' in auth_state and auth_state['id'] == author_id):

            # Edit quiz form submission handler
            if request.method == 'POST':
                # Get the quiz object _id
                quiz_id = ObjectId(request.args.get('id'))

                # Get the quiz category
                quiz_category = request.form.get('quizCategory')

                # Get the category object _id
                category_id = getCategoryId(quiz_category)

                # Update the quiz document with the title and category from the
                # POST request
                mongo.db.quizzes.update_one(
                    {'_id': quiz_id},
                    {'$set': {
                        'title': request.form.get('quiz_title'),
                        'category_id': category_id
                    }}
                )

                # Get a list of existing quiz rounds
                round_id_list = list(mongo.db.rounds.find({
                    'quiz_id': quiz_id
                }, {
                    '_id': 1
                }))

                # Get the round count + 1
                round_count = int(request.form.get('roundCount')) + 1

                # Initialise Round Deletion List
                delete_list = []
                for round_id in round_id_list:
                    delete_list.append(round_id['_id'])

                # Finalise Round Deletion List
                # Iterate over returned rounds, removing any from the delete
                # list that still exist in the POST request
                for rId in range(1, round_count):
                    rnd_id = request.form.get('round_' + str(rId) + '_id')
                    for round_id in round_id_list:
                        if (round_id['_id'] == ObjectId(rnd_id) and
                                rnd_id is not None):
                            delete_list.remove(round_id['_id'])
                            break

                # If any rounds remain in the deletion list, delete them and
                # any associated questions
                if len(delete_list) > 0:
                    for rId in delete_list:
                        mongo.db.rounds.find_one_and_delete({'_id': rId})
                        mongo.db.questions.delete_many({'round_id': rId})

                # Update rounds
                # Iterate over returned rounds...
                for rId in range(1, round_count):
                    # Convert the rId to a string
                    rId = str(rId)

                    # If this is a general knowledge quiz...
                    if (quiz_category.lower() == 'general knowledge'):
                        # Get the category object _id for the round category
                        round_category_id = getCategoryId(
                            request.form.get('roundCategory_' + rId)
                        )
                    else:
                        # Otherwise the round category object _id is equal to
                        # the quiz category object _id
                        round_category_id = category_id

                    # Get the round _object id
                    round_id = request.form.get('round_' + rId + '_id')

                    # If no round object _id is returned, this is a new round
                    if round_id is None:

                        # Create a round_data object
                        round_data = {
                            'quiz_id': quiz_id,
                            'round_num': int(rId),
                            'title': request.form.get('round_title_' + rId),
                            'author_id': auth_state['id'],
                            'date': datetime.datetime.now(),
                            'category_id': round_category_id,
                            'public': False
                        }

                        # Create round document
                        createRound(rId, round_data)

                    # Otherwise the round exists, so update it
                    else:
                        # Get the round object _id
                        round_id = ObjectId(round_id)

                        # Update the round document title and category object
                        # _id
                        mongo.db.rounds.update_one(
                            {'_id': round_id},
                            {'$set': {
                                'title': request.form.get(
                                    'round_title_' + rId
                                ),
                                'category_id': round_category_id
                            }}
                        )

                        # Get a list of existing questions for this round
                        question_id_list = list(mongo.db.questions.find({
                            'round_id': round_id
                        }, {
                            '_id': 1
                        }))

                        # Get the question count + 1
                        question_count = int(request.form.get(
                            'questionCount_' + rId
                        )) + 1

                        # Initialise question deletion list
                        delete_list = []
                        for question_id in question_id_list:
                            delete_list.append(question_id['_id'])

                        # Finalise question deletion list
                        # Iterate over returned questions, removing any from
                        # the delete list that still exist in the POST request
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
                        # Iterate over returned questions...
                        for qId in range(1, question_count):
                            # Convert the qId to a string
                            qId = str(qId)

                            # Get the question object _id
                            question_id = request.form.get(
                                'question_' + rId + '_' + qId + '_id'
                            )

                            # If no question object _id, this is a new question
                            if question_id is None:

                                # Create a question_data object
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

                                # create question document
                                createQuestion(rId, qId, question_data)

                            # Otherwise this question exists, so update it
                            else:
                                # Get the question object _id
                                question_id = ObjectId(question_id)

                                # Define update_question object
                                update_question = {
                                    # Get question text
                                    'question_text': request.form.get(
                                        'question_' + rId + '_' + qId
                                    ),
                                    # Get question image url
                                    'question_img_url': request.form.get(
                                        'q_img_' + rId + '_' + qId
                                    )
                                }

                                # Get multiple choice checkbox value
                                multiple_choice = request.form.get(
                                    'quizMulti_' + rId + '_' + qId
                                )

                                # Convert checkbox value to boolean
                                multiple_choice = transposeWithBoolean(
                                    multiple_choice
                                )

                                # If not multiple choice...
                                if multiple_choice is False:
                                    # Get answer text
                                    update_question[
                                        'answer_text'
                                    ] = request.form.get(
                                        'answer_' + rId + '_' + qId
                                    )

                                    # Get answer image url
                                    update_question[
                                        'answer_img_url'
                                    ] = request.form.get(
                                        'a_img_' + rId + '_' + qId
                                    )

                                    # Set multiple choice value
                                    update_question[
                                        'multiple_choice'
                                    ] = multiple_choice

                                    # Set multiple choice option count to 0
                                    update_question[
                                        'multi_count'
                                    ] = 0

                                # If multiple choice...
                                if multiple_choice is True:
                                    # declare multi_array
                                    multi_array = []

                                    # Get the multiple choice option count + 1
                                    multi_count = int(request.form.get(
                                        'multiCount_' + rId + '_' + qId
                                    )) + 1

                                    # Iterate over multiple choice options...
                                    for multi in range(1, multi_count):
                                        # Get the answer text
                                        answer_text = request.form.get(
                                            'answer_' + rId + '_' + qId +
                                            '_' + str(multi))

                                        # Get the .correct checkbox value
                                        correct = request.form.get(
                                            'correct_' + rId + '_' + qId +
                                            '_' + str(multi))

                                        # Get the answer image url
                                        answer_url = request.form.get(
                                            'a_img_' + rId + '_' + qId +
                                            '_' + str(multi))

                                        # Convert checkbox value to boolean
                                        correct = transposeWithBoolean(correct)

                                        # package the values into an option
                                        # object, add an option number, and
                                        # append to the multi_array list
                                        multi_array.append({
                                            'option_num': int(multi),
                                            'answer_text': answer_text,
                                            'correct': correct,
                                            'answer_img_url': answer_url
                                        })

                                    # Add the number of multiple choice options
                                    update_question[
                                        'multi_count'
                                    ] = len(multi_array)

                                    # Set the multiple choice value
                                    update_question[
                                        'multiple_choice_options'
                                    ] = multi_array

                                # Define update_params list
                                update_params = [
                                    {'$set': update_question}
                                ]

                                # If not multiple choice, append an unset
                                # object to the update_params list
                                if multiple_choice is False:
                                    update_params.append(
                                        {'$unset': 'multiple_choice_options'}
                                    )

                                # update the question
                                mongo.db.questions.update_one(
                                    {'_id': question_id},
                                    update_params
                                )

                # display a flash message
                flash("Quiz Saved")

                # Get the cancel url
                cancel_url = generateCancelUrl(request.form.get('cancel_url'))

                # redirect to referrer passing the cancel url
                return redirect(request.referrer +
                                '&cancel_url=' + cancel_url)

            # GET method handler
            # Set show_answers to true
            params['show_answers'] = True

            # Get the quiz data set
            quiz = buildViewQuizDataSet(params)

            # Get category data
            category_data = getCategories()

            # Get the cancel url
            cancel_url = generateCancelUrl(request.args.get('cancel_url'))

            # render the 'edit_quiz' template, passing the quiz, category data
            # and cancel url
            return render_template("edit_quiz.html",
                                   quiz=quiz,
                                   quiz_categories=category_data,
                                   cancel_url=cancel_url)

        # If not authorised or author display flash message
        flash("Permission Denied")
        # If not logged in redirect to login page
        if auth_state['auth'] is False and type(auth_state['reason']) == str:
            return redirect(url_for('login'))

        # Otherwise if logged in, redirect to quiz_search page
        return redirect(url_for('quiz_search'))

    # Quiz Sheet request
    # Get the quiz data set (minus answers)
    quiz = buildViewQuizDataSet(params)

    # render the 'quiz_sheet' template, passing the quiz object
    return render_template("quiz_sheet.html", viewQuiz=quiz)


# Validate a quiz title to ensure it is unique
# Requires:
#   quiz_title: string to validate
#   quiz_id: OPTIONAL. object _id of a quiz. Passed when editing or copying an
#            existing quiz, to ensure that the title cannot be false by
#            matching with itself when testing uniqueness.
#            Default is None.
def validateQuizTitle(quiz_title, quiz_id=None):
    # Check that user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:

        # Get user object _id
        author_id = auth_state['id']

        # If the quiz_id is provided, return the author_id field for that quiz
        if quiz_id is not None:
            author_id = mongo.db.quizzes.find_one({
                '_id': ObjectId(quiz_id)
            }, {
                '_id': 0,
                'author_id': 1
            })

            # If the author_id was returned, set author_id to the author_id
            # value
            if author_id is not None:
                author_id = author_id['author_id']

        # If we have an author_id and it matches the current user, or a global
        # or content admin...
        if (author_id is not None and (author_id == auth_state['id'] or
            (auth_state['reason']['role'] == 'Global Admin' or
                auth_state['reason']['role'] == 'Content Admin'))):

            # return the quiz object _id for any quiz with a matching title and
            # author_id
            validate = mongo.db.quizzes.find_one(
                {
                    'title': quiz_title,
                    'author_id': author_id
                }, {
                    '_id': 1
                })

            # If we found a quiz...
            if validate:
                # If the provided quiz object _id and the found quiz object _id
                # match, then validate true
                if ObjectId(quiz_id) == validate['_id']:
                    validate = True
                else:
                    # Otherwise, the title is in use by this user for another
                    # quiz, so validate false
                    validate = False
            else:
                # Otherwise we have no results, so validate true
                validate = True

            # return true/false
            return validate

        # Otherwise display a flash message and redirect to the quiz_search
        # page
        flash("Permission Denied")
        return redirect(url_for("quiz_search"))

    # Otherwise display a flash message and redirect to the login page
    flash("Permission Denied")
    return redirect(url_for("login"))


# Allow external requests to validate a quiz title
@app.route("/validate_quiz_title")
def validate_quiz_title():
    # Get the quiz title
    quiz_title = request.args.get('quizTitle')

    # Get the quiz object _id
    quiz_id = request.args.get('id')

    # validate the title
    validate_title = validateQuizTitle(quiz_title, quiz_id)

    # Convert python boolean to js boolean
    if validate_title is False:
        validate_title = 'false'
    else:
        validate_title = 'true'

    # return the validation result
    return validate_title


# Validate a username to ensure it is unique
# Requires:
#   new_user_id: The username string to validate
#   original_user_id: OPTIONAL. The original username for comparison
def validateUserId(new_user_id, original_user_id):
    # If the user Id values do not match...
    if new_user_id != original_user_id:
        # check if new_user_id is already in use
        exists = mongo.db.users.find_one({"user_id": new_user_id})

        # If new_user_id is in use...
        if exists:
            return False  # return false
        else:
            return True  # Otherwise return true
    else:
        return True  # Otherwise the user Id values match, so return true


# Allow external requests to validate a username
@app.route("/validate_user_id")
def validate_user_id():
    # Get the original username
    original_user_id = request.args.get('orig_user_id')

    # If the original username was returned, convert it to lower case
    if original_user_id:
        original_user_id = original_user_id.lower()

    # Get the new username and convert it to lower case
    new_user_id = request.args.get('user_id').lower()

    # validate the username
    validate_user_id = validateUserId(new_user_id, original_user_id)

    # Convert python boolean to js boolean
    if validate_user_id is False:
        validate_user_id = 'false'
    else:
        validate_user_id = 'true'

    # return the validation result
    return validate_user_id


# User Search
# Return batch of 10 users for provided search criteria.
# Access restricted to Global Admin and User Account Admin.
@app.route("/userSearch")
def userSearch():
    # Check if user is logged in, and a global or user account admin
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:
        # Get the requested results page
        page = int(request.args.get('page'))

        # Get the search string
        searchStr = request.args.get('searchStr')

        # Set the limit to 10
        limit = 10

        # Number of records to skip = (page x limit) - limit
        skip = (page * limit) - limit

        # Get global admin role object _id
        global_admin = mongo.db.user_roles.find_one(
            {"role": "Global Admin"},
            {"_id": 1})['_id']

        # Get user account admin role object _id
        user_account_admin = mongo.db.user_roles.find_one(
            {"role": "User Account Admin"},
            {"_id": 1})['_id']

        # Build the search query
        search_query = [{
            # wildcard search query.  searchStr vs user_id and email fields
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
                        # ignore global_admin, user_account_admin members
                        ObjectId(global_admin),
                        ObjectId(user_account_admin)
                    ]
                }
            }
        }, {
            # return user_role data for the users role
            '$lookup': {
                'from': 'user_roles',
                'localField': 'role_id',
                'foreignField': '_id',
                'as': 'role_details'
            }
        }, {
            # merge user role data back into the parent result set
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
            # return role_group data for the users role group
            '$lookup': {
                'from': 'role_groups',
                'localField': 'role_group_id',
                'foreignField': '_id',
                'as': 'role_group_details'
            }
        }, {
            # merge role group data back into the parent result set
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
            # return 2 result facets
            '$facet': {
                'results': [{
                    # remove unnecessary cols from the results
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
                    # sort by role group, role, user_id
                    '$sort': {
                        'role_group': 1,
                        'role': 1,
                        'user_id': 1
                    }
                }, {
                    # skip this number of results before returning
                    '$skip': skip
                }, {
                    # return this number of results after skipping
                    '$limit': limit
                }],
                # total result count
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

        # If user is Global Admin, remove the Global Admin and User Account
        # Admin role restrictions from the query
        if auth_state['reason']['role'] == 'Global Admin':
            search_query.pop(1)

        # return the search query results as a list
        user_data = list(mongo.db.users.aggregate(search_query))[0]

        # Get total users
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

        # If the requested page is > total_pages, then page = total_pages
        if (page > total_pages):
            page = total_pages

        # Build formatted html from the result set
        html = buildUserHtml(user_data['results'])

        # Define a results object
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

        # return the results object
        return results

    # Otherwise display a flash message and redirect to the my_quizzes page
    flash("Permission Denied")
    return redirect(url_for("my_quizzes"))


# Get Users
# Return batch of 10 users for specified role group.
# Access restricted to Global Admin and User Account Admin.
@app.route("/getUsers")
def getUsers():
    # Check if user is logged in, and a global or user account admin
    auth_criteria = {
        'is_admin': True,
        'role': [
            'Global Admin',
            'User Account Admin'
        ]
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:
        # Get the requested results page
        page = int(request.args.get('page'))

        # Get the user role
        role = request.args.get('role')

        # Set the limit to 10
        limit = 10

        # Get the user role object _id
        user_role_id = (mongo.db.user_roles.find_one(
            {'role': role},
            {'_id': 1}
        ))['_id']

        # Get user totals
        totals = getUserTotals()

        # Iterate over the user totals, and return the user membership count
        # for the provided user role
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

        # If the requested page is > total_pages, then page = total_pages
        if (page > total_pages):
            page = total_pages

        # Number of records to skip = (page x limit) - limit
        skip = (page * limit) - limit

        # Build the query
        query = [{
            # Filter results by user role
            '$match': {
                'role_id': ObjectId(user_role_id)
            }
        }, {
            # return user_role data for the users role
            '$lookup': {
                'from': 'user_roles',
                'localField': 'role_id',
                'foreignField': '_id',
                'as': 'role_details'
            }
        }, {
            # merge user role data back into the parent result set
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
            # return role_group data for the users role group
            '$lookup': {
                'from': 'role_groups',
                'localField': 'role_group_id',
                'foreignField': '_id',
                'as': 'role_group_details'
            }
        }, {
            # merge role group data back into the parent result set
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
            # remove unnecessary cols from the results
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
            # sort by role group, role, user_id
            '$sort': {
                'role_group': 1,
                'role': 1,
                'user_id': 1
            }
        }, {
            # skip this number of results before returning
            '$skip': skip
        }, {
            # return this number of results after skipping
            '$limit': limit
        }]

        # return the query results as a list
        user_data = list(mongo.db.users.aggregate(query))

        # Build formatted html from the result set
        html = buildUserHtml(user_data)

        # Define a results object
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

        # return the results object
        return results

    # Otherwise display a flash message and redirect to the my_quizzes page
    flash("Permission Denied")
    return redirect(url_for("my_quizzes"))


# Create a new quiz
@app.route("/new_quiz", methods=["GET", "POST"])
def new_quiz():
    # Check user is logged in
    auth_criteria = {
        'auth': True
    }
    auth_state = auth_user(auth_criteria)

    # If user is authorised...
    if auth_state['auth']:

        # new quiz form submission handler
        if request.method == "POST":
            # Create quiz, round and question documents
            quiz_id = createQuiz(auth_state['id'])

            # Dislay a flash message
            flash('Quiz Created')

            # Get the cancel url
            cancel_url = generateCancelUrl(request.form.get('cancel_url'))

            # redirect to the edit_quiz page, passing the quiz object _id of
            # the new quiz, and the cancel url
            return redirect(url_for('edit_quiz',
                                    id=quiz_id,
                                    cancel_url=cancel_url))

        # GET method handler
        # Get categories
        category_data = getCategories()

        # Get the cancel url
        cancel_url = generateCancelUrl(request.args.get('cancel_url'))

        # render the 'new_quiz' template, passing the category data and cancel
        # url
        return render_template("new_quiz.html",
                               quiz_categories=category_data,
                               cancel_url=cancel_url)

    # Otherwise, display a flash message and redirect to the login page
    flash('Please log in to create a quiz')
    return redirect(url_for("login"))


# app.run
if __name__ == "__main__":
    app.run(host=os.environ.get("IP"),
            port=int(os.environ.get("PORT")),
            debug=True)
