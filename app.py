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

        register = {
            "role_id": ObjectId("6026ba89f53ae31761a5a24a"),
            "user_id": request.form.get("user_id").lower(),
            "pwd": generate_password_hash(request.form.get("pwd")),
            "email": request.form.get("email").lower()
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
            {"user_id": request.form.get("user_id").lower()})

        if existing_user:
            # ensure hashed password matches user input
            if check_password_hash(
                    existing_user["pwd"], request.form.get("pwd")):
                session["user"] = request.form.get("user_id").lower()
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
    # remove user from session cookies
    flash("You have been logged out")
    session.pop("user")
    return redirect(url_for("login"))


@app.route("/admin_users", methods=["GET", "POST"])
def admin_users():
    # groups = list(mongo.db.role_groups.find().sort("role_group"))
    # roles = list(mongo.db.user_roles.find().sort("role", 1))
    # users = list(mongo.db.users.find().sort("user_id", 1))
    # return render_template("admin_users.html", users=users)

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
                                             ['$role_group_details', 0]},
                                            '$$ROOT']}}},
                        {'$project':
                         {'role_group_details': 0,
                          '_id': 0,
                          'role_group_id': 0}}]
    user_roles = list(mongo.db.user_roles.aggregate(user_roles_query))

    role_groups_query = [{'$project':
                          {'_id': 0}}]

    role_groups = list(mongo.db.role_groups.aggregate(role_groups_query))

    return render_template("admin_users.html", users=users, user_roles=user_roles, role_groups=role_groups)


if __name__ == "__main__":
    app.run(host=os.environ.get("IP"),
            port=int(os.environ.get("PORT")),
            debug=True)
