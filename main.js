$(document).ready(function () {
    $('#loading').hide();

})
$(document).ready(function () {
    $('#p1').hide();

})
$(document).ready(function () {
    $('#p2').hide();

})
$(document).ready(function () {
    $('#p3').hide();

})

$(document).ready(function () {
    $('#p4').hide();

})

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function login() {
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/login',
        beforeSend: function (req) {
            $('#loading').show();
            req.setRequestHeader("Content-Type", "application/json");
        },
        data: JSON.stringify({
            "email": document.getElementById('email').value,
            "password": document.getElementById('password').value

        }),
        success: function (res) {
            document.cookie = `token=${res}`
            window.location = "/dashBoard.html"
        },
        error: function (err) {
            console.log(err)
            alert("email or password incorrect")
            $('#description').text('Failed');
            window.location = "/index.html"
        }
    })
}

function logout() {
    document.cookie = 'token=; expires=Sun 4 Jan 1920 00:00:00 UTC;';
    window.location = '/index.html';
}

function authRequester() {
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/authorizationRequester',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {
            alert("Access Granted, Hi Requester!")
            $('#loading').show();
            window.location = '/createPo.html'

        },
        error: function (err) {
            console.error(err)
            alert("Access Denied: your account is not registered as Requester")
        }
    })

}

function checkSession() {
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/sessionCheck',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {

        },
        error: function (err) {
            alert("Please login first")
            window.location = '/index.html'
        }
    })
}

// function addItem(){
//     type = document.getElementById("typePo").value;
//     nameItem = document.getElementById("nameItem").value;
//     description = document.getElementById("description").value;
//     storageLocation = document.getElementById("storageLocation").value;
//     quantity = document.getElementById("quantity").value;
//     price = document.getElementById("price").value;
//     note = document.getElementById("Note2").value;

//     document.getElementById("theItem").reset()

//     let totalPrice = Number(quantity) * Number(price);
//     console.log(totalPrice);



// }


// FUNGSI BIKINAN NAUFAL
function getAllDataItem() {

    // //////////////////////////////// Request ////////////////////////////////////////
    // autoComplete
    var obj = new Object(),
        autoComplete = $('#poItemDropdown select').get()
    input = $('#addPoItem input').get()
    textarea = $('#addPoItem2 textarea').get()
    // autoComplete = document.querySelectorAll('.parent .child1');
    for (let i = 0; i < autoComplete.length; i++) {
        var id = $(autoComplete).eq(i).attr("id"),
            val = $(autoComplete).eq(i).val()
        console.log(val)
        obj[`${id}`] = val
    }

    for (let i = 0; i < input.length; i++) {
        var id = $(input).eq(i).attr("id"),
            val = $(input).eq(i).val()
        console.log(val)
        obj[`${id}`] = val
    }

    for (let i = 0; i < textarea.length; i++) {
        var id = $(textarea).eq(i).attr("id"),
            val = $(textarea).eq(i).val()
        console.log(val)
        obj[`${id}`] = val
    }


    // input (date)

    var startPoDate = $('#poStartDate').val()
    obj['poStartDate'] = startPoDate

    var endPoDate = $('#completionDate').val()
    obj['completionDate'] = endPoDate

    var contractnumber = document.getElementById("sapContractNumber").innerHTML;
    obj['contract_number'] = contractnumber
    // obj['contract_number'] = contractnumber
    // // justification
    // var just = $('#justification').val()
    // obj['justification'] = just


    // //////////////////////////////// Item ////////////////////////////////////////
    var array = new Array(),
        rows = $('table.table tbody tr').get()
    rows.forEach(row => {

        var tds = $(row).find('td').get(),
            item_obj = new Object()
        tds.forEach(td => {
            var id = $(td).attr("id"),
                text = $(td).text()
            item_obj[`${id}`] = text
        })
        array.push(item_obj)
    })
    document.getElementById("theItem").reset()

    console.log(array)

    // ///////////////////////////////// Data to send to Backend ///////////////////////////////////////
    var obj_data = new Object()
    obj_data["request_data"] = obj
    obj_data["array_item"] = array

    console.log("ini objek data" + obj_data)

    // /////////////////////////////// Kirim pake Ajax //////////////////////////////////////
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/createRecord',
        beforeSend: function (req) {
            req.setRequestHeader('Content-Type', 'application/json')
            req.setRequestHeader('Authorization', getCookie('token'))
        },
        data: JSON.stringify(
            obj_data
        ),
        complete: function (res) {
            alert("Data telah dimasukkan ke dalam DB")
            var number = window.location.search
            contractnumber = number.substr(length - 12)
            window.location = "/submitToSCM.html?SAP_contract_number=" + contractnumber
        },
        error: function (err) {
            alert(err)
        }
    })
}



function addItemToTabel() {
    var item_name = $('#itemname').val()
    var item_type = $('#typePo').val()
    var description = $('#description').val()
    var storageLocation = $('#storageLocation').val()
    var quantity = $('#quantity').val()
    var price = $('#price').val()
    var note = $('#noteItem').val()


    // jQuery
    var table = $('table.table tbody'),
        row = table.find('tr')
    table.append(`<tr id="deleteThisRow${row.length + 1}">
    <th id="noTablePo"scope="row">${row.length + 1}</th>
    <td id="itemDetail">
        ${item_name}
    </td>
    <td id="type">${item_type}</td>
    <td id="description2">${description}</td>
    <td id="storageLocation2">${storageLocation}</td>
    <td id="tbl_quantity${row.length + 1}">${quantity}</td>
    <td id="tbl_price${row.length + 1}">${price}</td>
    <td id="note2">${note}</td>
    <td id="action">
        <button onclick="deleterow(${row.length + 1})" type="submit" class="btn btn-danger btn-custom" id="actionDelete">
            <i class="fas fa-fw fa-trash-alt"></i> Delete</button>
    </td>

    </tr>`)
    document.getElementById("theItem").reset()
    sum = 0
    price = 0
    total_price = 0

    rows = $('table.table tbody tr').get()
    index = 1
    rows.forEach(row => {
        var tds = $(row).find('#tbl_quantity' + index).html(),
            sum = Number(tds)
        // console.log(sum)
        var tds2 = $(row).find('#tbl_price' + index).html(),
            price = Number(tds2)

        total_price += sum * price

        console.log(total_price)

        display = document.getElementById('totalAmount')
        display.value = total_price
        index++;
    })
}

function deleterow(id) {

    var quantity = $('#tbl_quantity' + id).text()
    var price = $('#tbl_price' + id).text()
    var total = quantity * price;

    var totalAmount = $('#totalAmount').val()
    $('#totalAmount').val(totalAmount - total)

    $('#deleteThisRow' + id).remove();

}

function getUserProfile() {
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/userProfile',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {
            profile = JSON.parse(res)

            $('#profileBox').append(`<h6 class="sidebar-text" id="namaStaff">${profile.username}</h6>
            <h6 class="sidebar-text" id="rolePosition">${profile.position}</h6>
            <h6 class="sidebar-text" id="npwp">${profile.payroll_number}</h6>`)

        },
        error: function (err) {
            alert(err)
        }

    })
}

function showPoSummary() {
    var number = window.location.search
    contractnumber = number.substr(length - 12)
    console.log(contractnumber)
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/getsummary',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": contractnumber
        }),
        success: function (res) {
            data = JSON.parse(res)
            console.log(data)
            var dataContract = data[0],
                dataItem = data[1]

            $('#left-information').append(`<p class="font-weight-normal" id="requesterName">${dataContract.requester_name}</p>
            <p class="font-weight-normal" id="poDate">${dataContract.po_start_date}</p>
            
            <p class="font-weight-normal" id="bpmSrNumber">${dataContract.bpm_sr_number}</p>
            <p class="font-weight-normal" id="bpmContractNumber">${dataContract.bpm_contract_number}</p>
            <p class="font-weight-normal" id="bpmPoNumber">${dataContract.bpm_po_number}</p>
            <p class="font-weight-normal" id="currency"> IDR </p>
            <p class="font-weight-normal" id="plant">${dataContract.plant}</p>`)

            $('#right-information2').append(`<p class="font-weight-normal" id="payrollNumber">${dataContract.payroll_number}</p>
            <p class="font-weight-normal mb-4" id="processId">${dataContract.process_id}</p>
            <p class="font-weight-normal" id="completionDate">${dataContract.po_completion_date}</p>
            <p class="font-weight-normal" id="sapSrNumber">${dataContract.sap_sr_number}</p>
            <p class="font-weight-normal" id="sapContractNumber">${dataContract.sap_contract_number}</p>
            <p class="font-weight-normal" id="vendorName">${dataContract.vendor_name}</p>`)

            $('#companyRepresentative').append(`<input type="text" class="form-control" id="companyRepresentative" placeholder="${dataContract.representative}" disabled>`)

            $('#companyToProvide').append(`<input type="text" class="form-control" id="companyToProvide" placeholder="${dataContract.to_provide}" disabled>`)

            $('#location').append(`<input type="text" class="form-control" id="location" placeholder="${dataContract.location}" disabled>`)

            $('#note').append(`<input type="text" class="form-control" id="note" placeholder="${dataContract.note}" disabled>`)

            $('#serviceChargeType').append(`<input type="text" class="form-control" id="serviceChargeType" placeholder="${dataContract.service_charge_type}" disabled>`)
            
            sum = 0
            price = 0
            total_price = 0
            
            dataItem.forEach((data, index) => {
                $('table.table tbody').append(`<tr>
                <th id="noTablePo"scope="row">${index+1}</th>
                <td id="itemDetail">${data.item_name}</td>
                <td id="budgetSource2">${data.description}</td>
                <td id="quantitys_${index}">${data.quantity}</td>
                <td id="unitPrice_${index}">${data.price}</td> 
                <td id="note">${data.note}</td> 
                <td id="subtotal">${data.storage_location}</td>
                </tr>`)

                total_price += data.quantity*data.price
            })
            $('#totalAmount').val(total_price)

            var role = $("#rolePosition").text();
            console.log(role)
            if (role === 'SCM') {
                $('#button-areas').append(`<button type="submit" class="btn btn-primary btn-custom mr-2" onclick="event.preventDefault(); scmapproved('Revise')" id="revision">Revision</button>
                <button type="submit" class="btn btn-primary btn-custom" onclick="event.preventDefault(); scmapproved('Approved')" id="approved">Approved</button>`)
            } else if (role === 'Manager') {
                $('#button-areas').append(`<button type="submit" class="btn btn-primary btn-custom mr-2" onclick="event.preventDefault(); managerapproval('${dataContract.sap_contract_number}')" id="revision">Approve</button>`)
            } else if (role === 'Contract Owner') {
                $('#button-areas').append(`<button type="submit" class="btn btn-primary btn-custom mr-2" onclick="event.preventDefault(); coapproval('${dataContract.sap_contract_number}')" id="revision">Approve</button>`)
            } else if (role === 'Requester') {
                $('#button-areas').append(`<button type="submit" class="btn btn-primary btn-custom mr-2" onclick="event.preventDefault(); requestersubmit('${dataContract.sap_contract_number}')" id="revision">Approve</button>`)
            }

        },
        error: function (err) {
            console.log(err)
        }
    })
}

function managerapproval(sap_contract_number) {
    var comment = $('#writeComment').val()
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/managerApproved',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": sap_contract_number,
            "comment": comment
        }),
        success: function (res) {
            alert(res)
            window.location = '/onProgress.html'
        },
        error: function (err) {
            alert(err)
        }
    })

}

function coapproval(sap_contract_number) {
    var comment = $('#writeComment').val()
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/ownerApproved',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": sap_contract_number,
            "comment": comment
        }),
        success: function (res) {
            alert(res)
            window.location = '/onProgress.html'
        },
        error: function (err) {
            alert(err)
        }
    })

}

function getcontract() {
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/getContract',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {
            contract = JSON.parse(res)
            index = contract.length - 1

            contract.forEach(data => {
                $('table.table tbody').append(`<tr>
                <th id="noTableCreate"scope="row">${contract.length - index}</th>
                <td id="sapContractNumber">
                    <a onclick="tocontract('${data.SAP_contract_number}')">${data.SAP_contract_number}</a>
                </td>
                <td id="vendornamePo">${data.vendor_name}</td>
                <td id="scopeOfwork">${data.scope_of_work}</td>
                <td id="poDate">${data.po_start}</td>
                <td id="poExpireDate">${data.po_end}</td>
                </tr>`)
                index = index - 1
            })

        },
        error: function (err) {
            console.log(err)
        }
    })
}

function tocontract(SAP_contract_number) {
    // var sapContractNumber = JSON.stringify(SAP_contract_number)
    // window.localStorage.setItem("number",sapContractNumber)
    // document.cookie = `contract_number=${SAP_contract_number}`
    window.location = "/poSummary.html?SAP_contract_number=" + SAP_contract_number
}

function getContractByNumber() {
    // var contractnumber = window.localStorage.getItem("number")
    var number = window.location.search
    contractnumber = number.substr(length - 12)
    // console.log(contractnumber)

    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/getcontractbynumber',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": contractnumber
        }),
        success: function (res) {
            data = JSON.parse(res)
            // console.log(data)
            $('#detailContract').append(`<p class="font-weight-normal mb-1" id="requesterName">${data.username}</p>
           
            <input type="date" class="form-control mb-2" id="poStartDate">
            <p class="font-weight-normal" id="bpmSrNumber">${data.bpm_sr_number}</p>
            <p class="font-weight-normal" id="bpmContractNumber">${data.bpm_contract_number}</p>
            <p class="font-weight-normal" id="bpmPoNumber">${data.bpm_po_number}</p>
            <p class="font-weight-normal mb-2" id="currency">IDR</p>
            <div class="form-group mb-2" id="poItemDropdown">
                <select class="form-control" id="plant">
                    <option>Bandung</option>
                    <option>Jakarta</option>
                </select>
            </div>`)

            $('#detailContract2').append(`<p class="font-weight-normal" id="payrollNumber">${data.payroll}</p>
            <p class="font-weight-normal" id="processId">N/A</p>
            <input type="date" class="form-control mb-2" id="completionDate">
            <p class="font-weight-normal" id="sapSrNumber">${data.sap_sr_number}</p>
            <p class="font-weight-normal" id="sapContractNumber">${data.sap_contract_number}</p>
            <p class="font-weight-normal" id="vendorName">${data.vendor_name}</p>`)
        },
        error: function (err) {
            console.log('adinda')
            alert(err)
        }
    })
}

function submitToSCM() {
    var number = window.location.search
    contractnumber = number.substr(length - 12)

    var comment = $('#writeComment').val()
    console.log(contractnumber)
    console.log(comment)
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/submitToSCM',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": contractnumber,
            "comment": comment
        }),
        success: function (res) {
            alert(res)
            alert("PO have succesfully submitted to SCM")
            window.location = '/dashBoard.html'
        },
        error: function (err) {
            console.log(err)
        }
    })

}

function getTaskListSCM() {
    records = []
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/getTaskList',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {
            // console.log(typeof res)
            // console.log(res)
            response = JSON.parse(res)
            details = response.data

            details.forEach(datum => {
                // console.log(datum.record_id)
                records.push(datum.record_id)


            })
            // if (records.length === 0) {
            //     getTaskListSCM()
            // }
            // console.log(records)
            sendRecords(records)

        },
        error: function (err) {
            alert("error din")
        }
    })
}

function sendRecords(records) {
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/showTaskList',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify(
            records
        ),
        success: function (res) {
            responseData = JSON.parse(res)
            data = responseData.data
            data.forEach((po, index) => {
                $('table.table tbody').append(`<tr>
                <th id="noTableCreate"scope="row">${index + 1}</th>
                <td id="sapContractNumber">${po.SAP_contract_number}</td>
                <td id="scopeOfwork">${po.scope_of_work}</td>
                <td id="totalPrice">${po.total_price}</td>
                <td id="poDate">${po.po_start}</td>
                <td id="poExpireDate">${po.po_end}</td>
                <td id="poAction"><button type="submit" class="btn btn-info btn-custom" onclick="tocontractScm('${po.SAP_contract_number}')" id="actionPo">
                    <i class="far fa-eye"></i> Action</button></td>
                </tr>`)
            })

        },
        error: function (err) {
            alert(err)
        }
    })

}

function tocontractScm(SAP_contract_number) {
    window.location = '/poSummaryScm.html?SAP_contract_number=' + SAP_contract_number
}

function scmapproved(decision) {
    var number = window.location.search
    contractnumber = number.substr(length - 12)
    console.log(decision)
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/scmDecision',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": contractnumber,
            "comment": $('#writeComment').val(),
            "decision": decision
        }),
        success: function (res) {
            alert("HORE")
            window.location = '/onProgress.html'
        },
        error: function (err) {
            alert(err)
        }
    })
}

function getCostCenter() {
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/getCostCenter',
        beforeSend: function (req) {
            $('#loading').show();
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {
            $('#loading').hide();
            costCenter = JSON.parse(res)

            costCenter.forEach((data, index) => {
                $('table.table tbody').append(`<tr>
                <th id="noTableCostCenter"scope="row">${index+1}</th>
                <td id="costCenter">${data.costcenter_name}</td>
                <td id="description">${data.description}</td>
                </tr>`)
                index = index - 1
            })

        },
        error: function (err) {
            $('#description').text('Failed');
            console.log(err)
        }
    })
}

function getTaskList() {
    records = []
    var tasklistOwner = '';
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/getTaskList',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (res) {
            // alert(res)
            response = JSON.parse(res)
            details = response.data

            details.forEach(datum => {
                tasklistOwner = datum.name

                records.push(datum.record_id)


            })
            // console.log(tasklistOwner)
            // console.log(records)
            showTaskList(tasklistOwner, records)
        },
        error: function (err) {
            alert(err)

        }
    })
}

function showTaskList(tasklistOwner, records) {
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/showTaskList',
        beforeSend: function (req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify(
            records
        ),
        success: function (res) {
            response = JSON.parse(res)
            data = response.data

            // alert(res)

            if (tasklistOwner === 'Manager Approval') {

                data.forEach((datum, index) => {
                    //    console.log("hey tayo")
                    $('table.table tbody').append(`<tr>
                   <th id="noTableOnProgress"scope="row">${index+1}</th>
                   <td class="" id="sapContractNumber">${datum.SAP_contract_number}</td>
                   <td class="" id="nameRequester">${datum.po_start}</td>
                   <td class="" id="vendorName">${datum.vendor_name}</td>
                   <td class="" id="scmChecklist">
                       <div class="checklist checklist--approved"></div>
                   </td>
                   <td class="" id="managerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="contractOwnerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="action">
                       <div class="viewActionButton">
                           <button type="submit" class="btn btn-primary mb-2 btn-custom" onclick="event.preventDefault(); tocontractScm('${datum.SAP_contract_number}')" id="viewActionButton">View</button>
                       </div>
                   </td>
                   </tr>`)

                })

            } else if (tasklistOwner === 'Requester') {
                data.forEach((datum, index) => {
                    $('table.table tbody').append(`<tr>
                   <th id="noTableOnProgress"scope="row">${index+1}</th>
                   <td class="" id="sapContractNumber">${datum.SAP_contract_number}</td>
                   <td class="" id="nameRequester">${datum.po_start}</td>
                   <td class="" id="vendorName">${datum.vendor_name}</td>
                   <td class="" id="scmChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="managerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="contractOwnerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="action">
                       <div class="viewActionButton">
                           <button type="submit" class="btn btn-primary mb-2 btn-custom" onclick="event.preventDefault(); tocontractScm('${datum.SAP_contract_number}')" id="viewActionButton">View</button>
                       </div>
                   </td>
                   </tr>`)
                })

            } else if (tasklistOwner === 'SCM Reviewer') {
                data.forEach((datum, index) => {
                    $('table.table tbody').append(`<tr>
                   <th id="noTableOnProgress"scope="row">${index+1}</th>
                   <td class="" id="sapContractNumber">${datum.SAP_contract_number}</td>
                   <td class="" id="nameRequester">${datum.po_start}</td>
                   <td class="" id="vendorName">${datum.vendor_name}</td>
                   <td class="" id="scmChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="managerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="contractOwnerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="action">
                       <div class="viewActionButton">
                           <button type="submit" class="btn btn-primary mb-2 btn-custom" onclick="event.preventDefault(); tocontractScm('${datum.SAP_contract_number}')" id="viewActionButton">View</button>
                       </div>
                   </td>
                   </tr>`)
                })

            } else if (tasklistOwner === 'Contract Owner Approval') {
                data.forEach((datum, index) => {
                    $('table.table tbody').append(`<tr>
                   <th id="noTableOnProgress"scope="row">${index+1}</th>
                   <td class="" id="sapContractNumber">${datum.SAP_contract_number}</td>
                   <td class="" id="nameRequester">${datum.po_start}</td>
                   <td class="" id="vendorName">${datum.vendor_name}</td>
                   <td class="" id="scmChecklist">
                       <div class="checklist checklist--approved"></div>
                   </td>
                   <td class="" id="managerChecklist">
                       <div class="checklist checklist--approved"></div>
                   </td>
                   <td class="" id="contractOwnerChecklist">
                       <div class="not-checklist"></div>
                   </td>
                   <td class="" id="action">
                       <div class="viewActionButton">
                           <button type="submit" class="btn btn-primary mb-2 btn-custom" onclick="event.preventDefault(); tocontractScm('${datum.SAP_contract_number}')" id="viewActionButton">View</button>
                       </div>
                   </td>
                   </tr>`)
                })

            }
        },
        error: function (err) {
            alert(err)
        }
    })
}

function getCountProgress() {
    $.ajax({
        method: 'GET',
        url: 'http://localhost:5000/getProgressBar',
        beforeSend: function (req) {
            // req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function (msg) {
            console.log(JSON.parse(msg))
            res = JSON.parse(msg)
            count = res['meta']['total_count']

            progPO = 100 - parseInt((3 / 3) * 100);
            progApproved = parseInt((count / 3) * 100);

            $('#pb-po').css('width', progPO + '%');
            $('#pb-po').text(progPO + '%');
            $('#pb-approved').css('width', progApproved + '%');
            $('#pb-approved').text(progApproved + '%');

        },
        error: function (error) {
            alert(error)
        }

    })
}

function finishedPo(){
    $.ajax({
        url: 'http://localhost:5000/completedPOList',
        beforeSend: function (req){
            req.setRequestHeader("Content-Type", "application")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        success: function(res){
            response = JSON.parse(res)
            response.forEach((data, index) =>{
                $('table.table tbody').append(`<tr>
                <th id="noTableOnProgress"scope="row">${index+1}</th>
                <td class="" id="sapContractNumber">${data.sap_contract_number}</td>
                
                <td class="" id="vendorName">${data.vendor_name}</td>
                <td class="" id="scmChecklist">
                    <div class="checklist checklist--approved"></div>
                </td>
                <td class="" id="managerChecklist">
                    <div class="checklist checklist--approved"></div>
                </td>
                <td class="" id="contractOwnerChecklist">
                    <div class="checklist"></div>
                </td>
                <td class="" id="action">
                    <div class="viewActionButton">
                        <button type="submit" class="btn btn-primary mb-2 btn-custom" onclick="event.preventDefault(); tosap('${data.sap_contract_number}')" id="viewActionButton">View</button>
                    </div>
                </td>
                </tr>`)
            })
        },
        error: function(err){
            alert(err)
        }
        
    })
}

function tosap(sap_contract_number){
    window.location = "/viewpo.html?SAP_contract_number="+ sap_contract_number       
}

function showSapSummary() {
    var number = window.location.search
    contractnumber = number.substr(length-12)
    console.log(contractnumber)
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/getsummary',
        beforeSend: function(req) {
            req.setRequestHeader("Content-Type", "application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number" : contractnumber
        }),
        success: function(res) {
            data = JSON.parse(res)
            console.log(data)
            var dataContract = data[0],
            dataItem = data[1]
            
            $('#left-information').append(`<p class="font-weight-normal" id="requesterName">${dataContract.requester_name}</p>
            <p class="font-weight-normal" id="poDate">${dataContract.po_start_date}</p>
            
            <p class="font-weight-normal" id="bpmSrNumber">${dataContract.bpm_sr_number}</p>
            <p class="font-weight-normal" id="bpmContractNumber">${dataContract.bpm_contract_number}</p>
            <p class="font-weight-normal" id="bpmPoNumber">${dataContract.bpm_po_number}</p>
            <p class="font-weight-normal" id="currency"> IDR </p>
            <p class="font-weight-normal" id="plant">${dataContract.plant}</p>`)
            
            $('#right-information2').append(`<p class="font-weight-normal" id="payrollNumber">${dataContract.payroll_number}</p>
            <p class="font-weight-normal mb-4" id="processId">${dataContract.process_id}</p>
            <p class="font-weight-normal" id="completionDate">${dataContract.po_completion_date}</p>
            <p class="font-weight-normal" id="sapSrNumber">${dataContract.sap_sr_number}</p>
            <p class="font-weight-normal" id="sapContractNumber">${dataContract.sap_contract_number}</p>
            <p class="font-weight-normal" id="vendorName">${dataContract.vendor_name}</p>`)
            
            $('#companyRepresentative').append(`<input type="text" class="form-control" id="companyRepresentative" placeholder="${dataContract.representative}" disabled>`)
            
            $('#companyToProvide').append(`<input type="text" class="form-control" id="companyToProvide" placeholder="${dataContract.to_provide}" disabled>`)
            
            $('#location').append(`<input type="text" class="form-control" id="location" placeholder="${dataContract.location}" disabled>`)
            
            $('#note').append(`<input type="text" class="form-control" id="note" placeholder="${dataContract.note}" disabled>`)
            
            $('#serviceChargeType').append(`<input type="text" class="form-control" id="serviceChargeType" placeholder="${dataContract.service_charge_type}" disabled>`)
            
            dataItem.forEach((data, index) => {
                $('table.table tbody').append(`<tr>
                <th id="noTablePo"scope="row">${index+1}</th>
                <td id="itemDetail">${data.item_name}</td>
                <td id="budgetSource2">${data.description}</td>
                <td id="quantity2">${data.quantity}</td>
                <td id="unitPrice">${data.note}</td> 
                <td id="subtotal">${data.storage_location}</td>
                </tr>`)
            })
            
            
        },
        error: function(err) {
            console.log(err)
        }
    })
}

function getCommentHistory(){
    var number = window.location.search
    contractnumber = number.substr(length-12)
    $.ajax({
        method: 'POST',
        url: 'http://localhost:5000/getCommentHistory',
        beforeSend: function(req){
            req.setRequestHeader("Content-Type","application/json")
            req.setRequestHeader("Authorization", getCookie('token'))
        },
        data: JSON.stringify({
            "sap_contract_number": contractnumber
        }),
        success: function(res){
            $('table.table tbody').append(`<div class="box-comment">
            <div class="box-isi-comment">
                <p class="font-weight-normal m-0 custom-name" id="userName">Riki Permana</p>
                <p class="font-weight-normal m-0 custom-comment" id="Comment">Saya sudah membuat SAP</p>
                <p class="font-weight-normal m-0 custom-date" id="dateComment">03-Apr-2019</p>
            </div>
        </div>`)
        },
        error: function(err){
            alert(err)
        }
    })
}