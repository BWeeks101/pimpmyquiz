import os
from flask import (
    Flask, flash, render_template,
    redirect, request, session, url_for)
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
if os.path.exists("env.py"):
    import env


app = Flask(__name__)

app.config["MONGO_DBNAME"] = os.environ.get("MONGO_DBNAME")
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
app.secret_key = os.environ.get("SECRET_KEY")

mongo = PyMongo(app)


@app.route("/")
@app.route("/home")
def home():
    if 'user' not in session:
        return redirect(url_for("login"))

    return render_template("home.html")


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


@app.route("/admin_users", methods=["GET", "POST"])
def admin_users():
    if 'user' not in session:
        print('Not Logged In')
    else:
        is_admin = mongo.db.users.find_one(
            {'user_id': session['user'].lower()},
            {'_id': 0, 'role_id': 1})
        role = mongo.db.user_roles.find_one(
            {'_id': ObjectId(is_admin['role_id'])})
        is_admin = mongo.db.role_groups.find_one(
            {'_id': ObjectId(role['role_group_id'])})
        if is_admin['role_group'] == 'Administrators Group':
            is_admin = True
        else:
            is_admin = False
        role = role['role']
        print(is_admin)
        print(role)
        if is_admin is True:
            if role == 'Global Admin' or role == 'User Admin':
                print('OK - ' + role)

                # POST Method
                if request.method == "POST":
                    existing_user = mongo.db.users.find_one(
                        {"user_id": request.form.get("orig_user_id").lower()},
                        {"_id": 1})

                    update_user = {
                        "user_id": request.form.get("user_id").lower(),
                        "email": request.form.get("email").lower(),
                        "locked": request.form.get("locked")
                    }

                    role = mongo.db.user_roles.find_one(
                        {"role": request.form.get("role")},
                        {"_id": 1})

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
                user_query = [{'$lookup':
                              {'from': 'user_roles',
                               'localField': 'role_id',
                               'foreignField': '_id',
                               'as': 'role_details'}},
                              {'$replaceRoot': {'newRoot':
                                                {'$mergeObjects':
                                                 [{'$arrayElemAt':
                                                  ['$role_details', 0]},
                                                  '$$ROOT']}}},
                              {'$lookup':
                              {'from': 'role_groups',
                               'localField': 'role_group_id',
                               'foreignField': '_id',
                               'as': 'role_group_details'}},
                              {'$replaceRoot':
                              {'newRoot':
                               {'$mergeObjects':
                                [{'$arrayElemAt':
                                 ['$role_group_details', 0]},
                                 '$$ROOT']}}},
                              {'$project':
                              {'role_group_details': 0,
                               'role_details': 0,
                               '_id': 0,
                               'role_group_id': 0,
                               'role_id': 0,
                               'pwd': 0}}]
                users = list(mongo.db.users.aggregate(user_query))

                user_roles_query = [{'$lookup':
                                    {'from': 'role_groups',
                                     'localField': 'role_group_id',
                                     'foreignField': '_id',
                                     'as': 'role_group_details'}},
                                    {'$replaceRoot': {'newRoot':
                                                      {'$mergeObjects':
                                                       [{'$arrayElemAt':
                                                        ['$role_group_details',
                                                         0]}, '$$ROOT']}}},
                                    {'$project':
                                    {'role_group_details': 0,
                                     '_id': 0,
                                     'role_group_id': 0}}]
                user_roles = list(
                    mongo.db.user_roles.aggregate(user_roles_query))

                role_groups_query = [{'$project': {'_id': 0}}]

                role_groups = list(
                    mongo.db.role_groups.aggregate(role_groups_query))

                for user in users:
                    for role in user_roles:
                        if 'member_count' not in role:
                            role['member_count'] = 0
                        if role['role'] == user['role']:
                            role['member_count'] += 1
                            for group in role_groups:
                                if 'member_count' not in group:
                                    group['member_count'] = 0
                                if group['role_group'] == role['role_group']:
                                    group['member_count'] += 1
                                    break
                            break

                return render_template("admin_users.html",
                                       users=users,
                                       user_roles=user_roles,
                                       role_groups=role_groups)
            else:
                print('Not Ok - ' + role)
        else:
            print('Permission Denied - ' + role)

    flash("Permission Denied")
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(host=os.environ.get("IP"),
            port=int(os.environ.get("PORT")),
            debug=True)
