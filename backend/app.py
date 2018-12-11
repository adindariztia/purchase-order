from flask import Flask, request, json, session, make_response, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from flask_restful import marshal, fields
from requests.utils import quote
import requests
import datetime
import os
import jwt


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:abahaos38@localhost:5432/purchase_order'
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, support_credentials=True)
db = SQLAlchemy(app)
jwtSecretKey = "companysecret"


##############################
########## DATABASE ##########
##############################

class Roles(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String())


class Costcenter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    costcenter_name = db.Column(db.String)
    description = db.Column(db.String)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String())
    payroll_number = db.Column(db.Integer())
    photoprofile = db.Column(db.String())
    email = db.Column(db.String())
    password = db.Column(db.String())
    token = db.Column(db.String())
    position_id = db.Column(db.Integer, db.ForeignKey('roles.id'))


class Contract(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    po_start = db.Column(db.String())
    po_end = db.Column(db.String())
    vendor_name = db.Column(db.String())
    scope_of_work = db.Column(db.String())
    total_price = db.Column(db.Integer())
    SAP_contract_number = db.Column(db.String())
    SAP_SR_number = db.Column(db.String())
    BPM_contract_number = db.Column(db.String())
    BPM_SR_number = db.Column(db.String())
    BPM_PO_number = db.Column(db.String())
    cost_center_id = db.Column(db.Integer, db.ForeignKey('costcenter.id'))
    record_id = db.Column(db.String())
    process_id = db.Column(db.String())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    currency = db.Column(db.String())
    plant = db.Column(db.String())

class Items(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String())
    type = db.Column(db.String())
    description = db.Column(db.String())
    storage_location = db.Column(db.String())
    quantity = db.Column(db.Integer())
    price = db.Column(db.Integer())
    note = db.Column(db.String())
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'))

class Header(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    representative = db.Column(db.String())
    to_provide = db.Column(db.String())
    location = db.Column(db.String())
    note = db.Column(db.String())
    budget_source = db.Column(db.String())
    service_charge_type = db.Column(db.String())
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'))


class Approval(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scm_approval = db.Column(db.Integer())
    manager_approval = db.Column(db.Integer())
    contract_owner_approval = db.Column(db.Integer())
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

#########################
####### NEXTFLOW ########
#########################

@app.route('/createRecord', methods=['POST'])
# inisiasi nextflow atau create record

def create_record():
    print(os.getenv('DEFINITION_ID'))
    if request.method == 'POST':
        decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithms=['HS256'])
        request_data = request.get_json()
        req_username = decoded["username"]
                

        userDB = User.query.filter_by(user_name=req_username).first()
        if userDB is not None:
            user_token = userDB.token
            print(user_token)
            # data template untuk create record
            record_instance = {
                "data": {
                    "definition": {
                        "id": os.getenv('DEFINITION_ID')
                    }
                }
            }

            # submit ke nextflow
            r = requests.post(os.getenv("BASE_URL_RECORD"), data=json.dumps(record_instance), headers={
                "Content-Type": "application/json", "Authorization": "Bearer %s" % user_token})

            # result from create record
            result = json.loads(r.text)
            record_id = result["data"]["id"]

            # sumbit flow menggunakan record_id dan token
            submit_result = submit_record(record_id, user_token)

            # masukkin data ke database
            data_db = submit_to_database(record_id, submit_result["data"]["process_id"],req_username)
            print(submit_result["data"]["process_id"])

            submitDataPoToDatabase()

            # return berupa id dan statusnya
            return "data_db", 200
        else:
            return "Token not found", 404



def submit_record(record_id, user_token):
    # data template untuk submit record
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithms=['HS256'])
    record_instance = {
        "data": {
            "form_data": {
                "pVRequester": "riki_requester_po@makersinstitute.com",
                "pVSCM": "cecep_scm_po@makersinstitute.com",
                "pVManager" : "adinda_manager_po@makersinstitute.com",
                "pVOwner" : "naufal_co_po@makersinstitute.com"
            },
            "comment": "Initiated"
        }
    }
    request_data = json.dumps(record_instance)

    # submit ke nextflow untuk dapat process_id tiap pesanan masuk/flow
    r = requests.post(os.getenv("BASE_URL_RECORD") + "/" + record_id + "/submit", data=request_data, headers={
        "Content-Type": "application/json", "Authorization": "Bearer %s" % user_token})

    result = json.loads(r.text)
    print(result)
    return result

# fungsi untuk submit data ke db
def submit_to_database(record_id, process_id,username):
    request_data = request.get_json()
    req_sap_contract_number = request_data['request_data']['contract_number']
    userDB = User.query.filter_by(user_name=username).first()
    data_db = Contract.query.filter_by(SAP_contract_number = req_sap_contract_number).first()
   
    data_db.record_id = record_id
    data_db.process_id = process_id
    data_db.user_id = userDB.id

    db.session.commit()
   
    return "Record berhasil dibuat"

# @app.route('/adinda', methods=['POST'])
def submitDataPoToDatabase():
    # print("ok")
    request_data = request.get_json()
    contractNumber = request_data['request_data']['contract_number']
    
    # insert data to table contract
    dataContract = Contract.query.filter_by(SAP_contract_number=contractNumber).first()
    dataContract.po_start = request_data['request_data']['poStartDate']
    dataContract.po_end = request_data['request_data']['completionDate']

    db.session.commit()

    # insert data to table header
    queryHeader = Header.query.filter_by(contract_id=dataContract.id).first()
    if queryHeader:
        print("ADAKOKNIH")
        queryHeader.representative = request_data['request_data']['companyRepresentative']
        queryHeader.to_provide = request_data['request_data']['companyToProvide']
        queryHeader.location = request_data['request_data']['location']
        queryHeader.note = request_data['request_data']['note']
        queryHeader.service_charge_type = request_data['request_data']['serviceChargeType']

        db.session.commit()

    else:
        print('masuk ke else')
        toHeader = Header(
            representative = request_data['request_data']['companyRepresentative'],
            to_provide = request_data['request_data']['companyToProvide'],
            location = request_data['request_data']['location'],
            note = request_data['request_data']['note'],
            # plant = request_data['request_data']['plant'],
            service_charge_type = request_data['request_data']['serviceChargeType'],
            contract_id = dataContract.id
        )

        db.session.add(toHeader)
        db.session.commit()

    # insert data to table item
    arrayData = request_data['array_item']
    index = 1
    for data in arrayData:
        item = Items(
            item_name = data['itemDetail'],
            type = data['type'],
            description = data['description2'],
            storage_location = data['storageLocation2'],
            quantity = data['tbl_quantity'+str(index)],
            price = data['tbl_price'+str(index)],
            note = data['note2'],
            contract_id = dataContract.id
        )
        index += 1
        db.session.add(item)
        db.session.commit()

    


    return "ok def adinda", 200
    



@app.route('/submitToSCM', methods=['POST'])
# fungsi untuk gerakin flow dari requester ke scm
def submit_to_scm():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    request_data = request.get_json()
    req_comment = request_data['comment']
    req_SAP_contract_number = request_data['sap_contract_number']
    req_username = decoded["username"]
    
    contract_doc = Contract.query.filter_by(SAP_contract_number = req_SAP_contract_number).first()
    process_id = contract_doc.process_id
    userDB = User.query.filter_by(user_name=req_username).first()    
    user_token = userDB.token
    print(process_id)
       
    def recursive():
        query = "folder=app:task:all&filter[name]=Requester&filter[state]=active&filter[definition_id]=%s&filter[process_id]=%s" % (
            os.getenv("DEFINITION_ID"), process_id)
        
        url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")
        r_get = requests.get(url, headers={
                             "Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token})
        result = json.loads(r_get.text)
        print(r_get.text)
        print("loading")
        if result['data'] is None or len(result['data']) == 0:
            print("masuk if")
            recursive()
        else:
            print("masuk else")
            # get scm email and task id
            SCM_email = result['data'][0]['form_data']['pVSCM']
            task_id = result['data'][0]['id']
            print(SCM_email)
            # gerakin flow ke scm dari requester
            submit_data = {
                "data": {
                    "form_data": {
                        "pVSCM": SCM_email

                    },
                    "comment": req_comment
                }
            }

            r_post = requests.post(os.getenv("BASE_URL_TASK") + "/" + task_id + "/submit", data=json.dumps(submit_data), headers={
                "Content-Type": "application/json", "Authorization": "Bearer %s" % user_token})
            result = json.loads(r_post.text)
            print(result)
            return r_get.text

    recursive()

    return "result"


@app.route('/scmDecision', methods=['POST'])
# fungsi keputusan dari SCM
def scm_decision():
    if request.method == "POST":
        decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
        request_data = request.get_json()
        print(decoded['username'])
        req_username = decoded["username"]
        req_SAP_contract_number = request_data['sap_contract_number']
        req_comment = request_data['comment']
        req_decision = request_data['decision']

        userDB = User.query.filter_by(user_name=req_username).first()
        contract_doc = Contract.query.filter_by(SAP_contract_number = req_SAP_contract_number).first()
        process_id = contract_doc.process_id
        print(process_id)
        

        def recursive():
            if userDB is not None:
                user_token = userDB.token
                query = "folder=app:task:all&page[number]=1&page[size]=10&filter[name]=SCM Reviewer&filter[state]=active&filter[process_id]=%s&filter[definition_id]=%s" % (process_id,os.getenv("DEFINITION_ID"))
                url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")

                r_get = requests.get(url, headers={
                    "Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token
                })
                result = json.loads(r_get.text)
                print("loading")
                
                if result['data'] is None or len(result['data']) == 0:
                    print("masuk if manager")
                    recursive()
                else:
                    print("masuk else manager")
                    # get manager email and task id
                    manager_email = result['data'][0]['form_data']['pVManager']
                    task_id = result['data'][0]['id']
                    print(manager_email)
                    # gerakin flow ke manager dari SCM
                    submit_data = {
                        "data": {
                            "form_data": {
                                "pVManager": manager_email,
                                "pVAction": req_decision

                            },
                            "comment": req_comment
                        }
                    }
                    
                    r_post = requests.post(os.getenv("BASE_URL_TASK") + "/" + task_id + "/submit", data=json.dumps(submit_data), headers={
                        "Content-Type": "application/json", "Authorization": "Bearer %s" % user_token})
                    result = json.loads(r_post.text)
                    print(result)
                    # return r_get.text

        recursive()
        if req_decision == 'Approved':
            submitApproval(req_username,contract_doc.id)
            return "flow sudah sampai manager"
        else:
            return "Flow kembali ke Requester", 200
        


@app.route('/managerApproved', methods=['POST'])
# fungsi keputusan dari SCM
def managerApproved():
    if request.method == "POST":
        decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
        request_data = request.get_json()

        req_username = decoded["username"]
        req_SAP_contract_number = request_data['sap_contract_number']
        req_comment = request_data['comment']
        
        userDB = User.query.filter_by(user_name=req_username).first()
        contract_doc = Contract.query.filter_by(SAP_contract_number = req_SAP_contract_number).first()
        process_id = contract_doc.process_id
        # contractDB = Contract.query.filter_by()

        def recursive():
            if userDB is not None:
                user_token = userDB.token
                query = "folder=app:task:all&page[number]=1&page[size]=10&filter[name]=Manager Approval&filter[state]=active&filter[process_id]=%s&filter[definition_id]=%s" % (process_id,os.getenv("DEFINITION_ID"))
                url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")

                r_get = requests.get(url, headers={
                    "Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token
                })
                result = json.loads(r_get.text)
                print("loading")
                
                if result['data'] is None or len(result['data']) == 0:
                    recursive()
                else:
                    # get manager email and task id
                    owner_email = result['data'][0]['form_data']['pVOwner']
                    task_id = result['data'][0]['id']
                    print(owner_email)
                    # gerakin flow ke manager dari SCM
                    submit_data = {
                        "data": {
                            "form_data": {
                                "pVOwner": owner_email
                                
                            },
                            "comment": req_comment
                        }
                    }
                    
                    r_post = requests.post(os.getenv("BASE_URL_TASK") + "/" + task_id + "/submit", data=json.dumps(submit_data), headers={
                        "Content-Type": "application/json", "Authorization": "Bearer %s" % user_token})
                    result = json.loads(r_post.text)
                    print(result)
                    return r_get.text

        recursive() 
        submitApproval(req_username,contract_doc.id)
        return "flow sudah sampai CO"


@app.route('/ownerApproved', methods=['POST'])
# fungsi keputusan dari SCM
def ownerApproved():
    if request.method == "POST":
        decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
        request_data = request.get_json()

        req_username = decoded['username']
        req_SAP_contract_number = request_data['sap_contract_number']
        req_comment = request_data['comment']
        
        userDB = User.query.filter_by(user_name=req_username).first()
        contract_doc = Contract.query.filter_by(SAP_contract_number = req_SAP_contract_number).first()
        process_id = contract_doc.process_id
        
        def recursive():
            if userDB is not None:
                user_token = userDB.token
                query = "folder=app:task:all&page[number]=1&page[size]=10&filter[name]=Contract Owner Approval&filter[state]=active&filter[process_id]=%s&filter[definition_id]=%s" % (process_id,os.getenv("DEFINITION_ID"))
                url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")

                r_get = requests.get(url, headers={
                    "Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token
                })
                result = json.loads(r_get.text)
                print("loading")
                
                if result['data'] is None or len(result['data']) == 0:
                    recursive()
                else:
                    # get task id
                    task_id = result['data'][0]['id']
                    
                    # gerakin flow ke manager dari SCM
                    submit_data = {
                        "data": {
                            "form_data": {
                                
                                
                            },
                            "comment": req_comment
                        }
                    }
                    
                    r_post = requests.post(os.getenv("BASE_URL_TASK") + "/" + task_id + "/submit", data=json.dumps(submit_data), headers={
                        "Content-Type": "application/json", "Authorization": "Bearer %s" % user_token})
                    result = json.loads(r_post.text)
                    print(result)
                    return r_get.text

        recursive()
        submitApproval(req_username,contract_doc.id)
        return "Release PO"
        

def submitApproval(username, contract_id):
    print(username, contract_id)
    data_db = Approval.query.filter_by(contract_id = contract_id).first()
    if data_db:
        dbUser = User.query.filter_by(user_name=username).first()
        role_id = dbUser.position_id

        if role_id == 2:
            data_db.scm_approval = 1
        elif role_id == 3:
            data_db.manager_approval = 1
        elif role_id == 4:
            data_db.contract_owner_approval =1

        db.commit()
        return "approved by ",str(dbUser.user_name)
    else:
        if role_id == 2:
            toHeader 
            toApproval = Approval(
                contract_id = contractId,
                scm_approval = 1
            )
            db.session.add(toApproval)
            db.session.commit()
            return "Approved by SCM", 200
        elif role_id == 3:
            toApproval = Approval(
                contract_id = contractId,
                manager_approval = 1
            )
            db.session.add(toApproval)
            db.session.commit()
            return "Approved by Manager", 200
        elif role_id == 4:
            toApproval = Approval(
                contract_id = contractId,
                contract_owner_approval = 1
            )
            db.session.add(toApproval)
            db.session.commit()
            return "Approved by Contract Owner"

@app.route('/getCommentHistory')
def getCommentHistory():
    history = []
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    email = decoded["email"]

    userDB  = User.query.filter_by(email = email).first()
    user_token = userDB.token
    data = request.get_json()
    contract_number = data['sap_contract_number']
    contract_doc = Contract.query.filter_by(SAP_contract_number = contract_number).first()
    recordId = contract_doc.record_id
    print(recordId)
    url = os.getenv("BASE_URL_RECORD") + "/" + recordId + "/stageview"

    r_get = requests.get(url, headers={
        "Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token
    })

    result = json.loads(r_get.text)

    index = 2
    while (index <= 8):
        if result['data'][index]:
            history.append(result['data'][index])
        index += 2
   

    history_json = json.dumps(history)

    return history_json, 200




########################
####### BACKEND ########
########################

# routing login
@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()

        email = data.get('email')
        password = data.get('password')
        # print(username, password)
        userDB = User.query.filter_by(email=email, password=password).first()

        if userDB:
            payload = {
                "email" : userDB.email,
                "username" : userDB.user_name                
            }
#    bikin token jwt
            encoded = jwt.encode(payload, jwtSecretKey, algorithm='HS256')
            return encoded, 201
            
        else:
            return "user does not exist",405
    else:
        return "Method not allowed", 405

# untuk memeriksa apakah sudah login
@app.route('/sessionCheck')
def checkSession():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithms=['HS256'])
    email = decoded['email']
    if email:
        return "bisa",200
    else:
        return "gagal",405

# routing to get user profile
@app.route('/userProfile')
def userProfile():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithms=['HS256'])
    email = decoded["email"]

    userDB = User.query.filter_by(email = email).first()
    userRole = Roles.query.filter_by(id = userDB.position_id).first()

    json_format = {
        "id" : userDB.id,
        "username" : userDB.user_name,
        "payroll_number" : userDB.payroll_number,
        "photoprofile" : userDB.photoprofile,
        "email" :userDB.email,
        "position" : userRole.role
    }

    user_json = json.dumps(json_format)
    return user_json, 201

@app.route('/authorizationRequester')
def authRequester(): #buat ngebatesin selain requester
    
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithms=['HS256'])
    email = decoded['email']

    userDB = User.query.filter_by(email=email).first()
    role = userDB.position_id
    if role == 1:
        return "Access Granted", 200
    else:
        return "Access Denied", 401

def authApprover():
    data = request.get_json()

    username = data.get('username')
    userDB = User.query.filter_by(user_name = username)
    role = userDB.role
    if role != 1:
        return "Access Granted", 200
    else:
        return "Access Denied", 401

# get all data for summary form
@app.route('/getsummary', methods=['POST'])
def getSummary():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithms=['HS256'])
    email = decoded["email"]

    data = request.get_json()
    contract_number = data['sap_contract_number']
    contract_doc = Contract.query.filter_by(SAP_contract_number = contract_number).first()
    userDB = User.query.filter_by(id= contract_doc.user_id).first()
    contract_id = contract_doc.id
    
    userRole = Roles.query.filter_by(id = userDB.position_id).first()
    headerDB = Header.query.filter_by(contract_id = contract_id).first()
    itemDB = Items.query.filter_by(contract_id = contract_id).all()

    summary = []

    item_json = {
        "item_name" : fields.String,
        "type" : fields.String,
        "description" : fields.String,
        "storage_location" : fields.String,
        "quantity" : fields.Integer,
        "price" : fields.Integer,
        "note" : fields.String,
        "contract_id" : fields.Integer
    }
    item_all = marshal(itemDB, item_json)

    json_format = {
        "requester_name" : userDB.user_name,
        "payroll_number" : userDB.payroll_number,
        # "requester_position" : userRole.role,
        "process_id" : contract_doc.process_id,
        "po_start_date" : contract_doc.po_start,
        "po_completion_date" : contract_doc.po_end,
        "bpm_sr_number" : contract_doc.BPM_SR_number,
        "bpm_contract_number" : contract_doc.BPM_contract_number,
        "bpm_po_number" : contract_doc.BPM_PO_number,
        "sap_sr_number" : contract_doc.SAP_SR_number,
        "sap_contract_number" : contract_doc.SAP_contract_number,
        "currency" : contract_doc.currency,
        "vendor_name" : contract_doc.vendor_name,
        "plant" : contract_doc.plant,
        "representative" : headerDB.representative,
        "to_provide" : headerDB.to_provide,
        "location" : headerDB.location,
        "note" : headerDB.note,
        "service_charge_type" : headerDB.service_charge_type       
    }

    summary.append(json_format)
    summary.append(item_all)
    # print(summary)
    summary_json = json.dumps(summary)

    return summary_json,200
    
# routing untuk menampilkan po approved oleh scm, manager, dan contract owner
@app.route('/completedPOList')
def completed_po():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    email = decoded["email"]
    approvalDB = Approval.query.all()
    completed_po = []

    for approval in approvalDB:
        if (approval.scm_approval + approval.manager_approval + approval.contract_owner_approval == 3):
            userDB = User.query.filter_by(id = approval.user_id, email = email).first()
            contractDB = Contract.query.filter_by(id = approval.contract_id).first()

            format_json = {
                "scm approval" : approval.scm_approval,
                "manager approval" : approval.manager_approval,
                "contract owner approval" : approval.contract_owner_approval,
                "requester name" : userDB.user_name,
                "sap conntract number" : contractDB.SAP_contract_number,
                "vendor name" : contractDB.vendor_name
            }

            completed_po.append(format_json)

    return json.dumps(completed_po)

# routing untuk menampilkan po yang belum selesai di approve
@app.route('/uncompletedPOList')
def uncompleted_po():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    email = decoded["email"]
    approvalDB = Approval.query.all()
    uncompleted_po = []

    for approval in approvalDB:
        if (approval.scm_approval + approval.manager_approval + approval.contract_owner_approval != 3):
            userDB = User.query.filter_by(id = approval.user_id, email = email).first()
            contractDB = Contract.query.filter_by(id = approval.contract_id).first()

            format_json = {
                "scm approval" : approval.scm_approval,
                "manager approval" : approval.manager_approval,
                "contract owner approval" : approval.contract_owner_approval,
                "requester name" : userDB.user_name,
                "sap conntract number" : contractDB.SAP_contract_number,
                "vendor name" : contractDB.vendor_name
            }

            uncompleted_po.append(format_json)

    return json.dumps(uncompleted_po)

# fungsi untuk menampilkan jumlah dokumen yang perlu di revisi oleh requester
@app.route('/totalRevise')
def get_revise():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    email = decoded["email"]
    userDB = User.query.filter_by(email = email).first()
    user_token = userDB.token

    query = "folder=app:task:all&filter[name]=Requester&filter[state]=active&filter[definition_id]=%s" % (
            os.getenv("DEFINITION_ID"))
        
    url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")
    r_get = requests.get(url, headers={"Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token})
    result = json.loads(r_get.text)

    return str(len(result['data']))

# fungsi untuk menampilkan list po yang perlu di revisi
@app.route('/reviseList')
def reviset_list():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    email = decoded["email"]
    userDB = User.query.filter_by(email = email).first()
    user_token = userDB.token

    query = "folder=app:task:all&filter[name]=Requester&filter[state]=active&filter[definition_id]=%s" % (
            os.getenv("DEFINITION_ID"))
        
    url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")
    r_get = requests.get(url, headers={"Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token})
    result = json.loads(r_get.text)

    to_revise = []
    for po in result['data']:
        process_id = po['process_id']
        contractDB = Contract.query.filter_by(process_id = process_id).first()
        userDB = User.query.filter_by(id = contractDB.user_id).first()
        json_format = {
            "sap contract number" : contractDB.SAP_contract_number,
            "requester" : userDB.user_name,
            "vendor name" : contractDB.vendor_name
        }
        to_revise.append(json_format)
    
    return json.dumps(to_revise)



@app.route('/getContract')
def getContract():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])

    email = decoded["email"]
    data = User.query.filter_by(email=email).first()
    dataUser = Contract.query.filter_by(user_id=data.id).all()
    
    if dataUser:
        contractDetail = {
            "po_start" : fields.String,
            "po_end" : fields.String,
            "vendor_name" : fields.String,
            "scope_of_work" : fields.String,
            "total_price" : fields.Integer,
            "SAP_contract_number" : fields.String,
            "SAP_SR_number" : fields.String,
            "BPM_contract_number" : fields.String,
            "BPM_SR_number" : fields.String,
            "BPM_PO_number" : fields.String,
            "cost_center_id" : fields.Integer

        }

        return (json.dumps(marshal(dataUser, contractDetail))) 

@app.route('/getcontractbynumber', methods=['POST'])
def getcontractbyid():
    identifier = request.get_json()
    print(identifier)
    contract_number = identifier['sap_contract_number']
    print(contract_number)
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    email = decoded["email"]
    data = User.query.filter_by(email=email).first()
    dataContract = Contract.query.filter_by(SAP_contract_number=contract_number).first()

    json_format = {
        "username": data.user_name,
        "payroll": data.payroll_number,
        "bpm_sr_number" : dataContract.BPM_SR_number,
        "bpm_contract_number" : dataContract.BPM_contract_number,
        "bpm_po_number": dataContract.BPM_PO_number,
        "sap_sr_number": dataContract.SAP_SR_number,
        "sap_contract_number": dataContract.SAP_contract_number,
        "vendor_name": dataContract.vendor_name
    }

    data_json = json.dumps(json_format)
    return data_json, 201

#getTaskList setiap state di nextflow berdasarkan yg login
@app.route('/getTaskList')
def getList():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    username = decoded['username']
    searchToken = User.query.filter_by(user_name=username).first()
    user_token = searchToken.token
    print(user_token)

    query = "folder=app:task:all&page[number]=1&page[size]=10&filter[name]=SCM Reviewer&filter[state]=active&filter[definition_id]=%s" % (os.getenv("DEFINITION_ID"))
    url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")

    r_get = requests.get(url, headers={
        "Content-Type": "Application/json", "Authorization": "Bearer %s" % user_token
    })
    result = json.loads(r_get.text)
    return r_get.text, 200

@app.route('/getProgressBar')
def getProgressBar():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])
    username = decoded['username']

    countRequester = tasklist('Requester', getTokenUser('riki_requester_po@makersinstitute.com'))
    countSCM = tasklist('SCM Reviewer', getTokenUser('cecep_scm_po@makersinstitute.com'))
    countManager = tasklist('Manager Approval',  getTokenUser('adinda_manager_po@makersinstitute.com'))
    countContractOwner = tasklist('Contract Owner Approval',  getTokenUser('naufal_co_po@makersinstitute.com'))

    count_json = {
        "count_requester": countRequester,
        "count_scm": countSCM,
        "count_manager": countManager,
        "count_contract_owner": countContractOwner

    }

    return jsonify(count_json)

def getTokenUser(email_user):
    userDB = User.query.filter_by(email=email_user).first()
    token = userDB.token
    return token


def tasklist(posisi,user_token):
    query = "folder=app:task:all&page[number]=1&page[size]=10&filter[name]=%s&filter[state]=active&filter[definition_id]=%s" % (posisi,os.getenv("DEFINITION_ID"))
    url = os.getenv("BASE_URL_TASK")+"?"+quote(query, safe="&=")

    r_get = requests.get(url, headers={
        "Content-Type": "Application/json", "Authorization": "Bearer "+ user_token
    })

    result = json.loads(r_get.text)
    count = result['meta']['total_count']
    return str(count)

@app.route('/showTaskList', methods=['POST'])
def showtask():
    contractList = {"data": []}
    data = request.get_json()
    for ww in data:
        contract = Contract.query.filter_by(record_id=ww).first()
        if contract:
            details = {
            "po_start" : contract.po_start,
            "po_end" : contract.po_end,
            "vendor_name" : contract.vendor_name,
            "scope_of_work" : contract.scope_of_work,
            "total_price" : contract.total_price,
            "SAP_contract_number" : contract.SAP_contract_number,
            "SAP_SR_number" : contract.SAP_SR_number,
            "BPM_contract_number" : contract.BPM_contract_number,
            "BPM_SR_number" : contract.BPM_SR_number,
            "BPM_PO_number" : contract.BPM_PO_number,
            "cost_center_id" : contract.cost_center_id  
            }
            contractList["data"].append(details)
    
    print(type(contractList))
    print(contractList)

    return json.dumps(contractList), 200

@app.route('/getCostCenter')
def getCostCenter():
    decoded = jwt.decode(request.headers["Authorization"], jwtSecretKey, algorithm=['HS256'])

    email = decoded["email"]
    data = User.query.filter_by(email=email).first()
    dataCost = Costcenter.query.all()
    
    if dataCost:
        costCenterDetail = {
            "costcenter_name" : fields.String,
            "description" : fields.String,

        }

        return (json.dumps(marshal(dataCost,costCenterDetail))) 


if __name__ == '__main__':
    app.run(debug=True, host=os.getenv("HOST"), port=os.getenv("PORT"))
