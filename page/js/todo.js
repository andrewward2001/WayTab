let tasks = {}
let todoDefault

chrome.storage.sync.get(['todoDate'], function({todoDate}) {
  todoDefault = todoDate
  if (todoDate === 'Tomorrow') {
    $('#todo-tomorrow').prop('selected', true)
    $('#todo-today').prop('selected', false)
    $('#todo-week').prop('selected', false)
  } else if (todoDate === 'Today') {
    $('#todo-tomorrow').prop('selected', false)
    $('#todo-today').prop('selected', true)
    $('#todo-week').prop('selected', false)
  } else if (todoDate === 'Week') {
    $('#todo-tomorrow').prop('selected', false)
    $('#todo-today').prop('selected', false)
    $('#todo-week').prop('selected', true)
  }
})

$(document).ready(() => {
  loadTasks()
  defaultController()

  $(document).on('click', '#addTask', function() {
    let button = $(this)
    let task = $('#newTask')
    let classSelector = $('#addTaskClass')
    let date = $('#taskDue')
    if(task.val() == '') {
      button.toggleClass('btn-danger').toggleClass('btn-outline-secondary')
      task.toggleClass('is-invalid')
      button.text('No task!')
      setTimeout(() => {
        button.toggleClass('btn-danger').toggleClass('btn-outline-secondary')
        task.toggleClass('is-invalid')
        button.text('Add')
      }, 1000)
    } else {
      tasks[classSelector.val() == 'Class...(default to misc)' ? 'Miscellaneous' : classSelector.val()].push([task.val(), date.val()])
      chrome.storage.sync.set({tasks: tasks}, () => {
        loadTasks()
      })
    }
  })

  $(document).on('click', '#undo-task-delete', function() {
    let taskArray = $(this).data('task').split(',')
    let taskArray1 = [...taskArray] // to make sure we get a copy of the contents, not just a reference
    taskArray1.splice(0,1)
    taskArray1.splice(taskArray1.length-1, 1)
    tasks[taskArray[0]].push([taskArray1.join(), taskArray[taskArray.length-1]])
    chrome.storage.sync.set({tasks: tasks}, () => {
      $('#undo-task-delete').remove()
      loadTasks()
    })
  })

  $(document).on('keyup', '#newTask', (e) => {
    if(e.keyCode == 13) {
      $('#addTask').trigger('click')
    }
  })
})

function loadTasks() {
  let lastTask
  chrome.storage.sync.get(['tasks'], function(result) {
    if(Object.keys(result).length === 0 && result.constructor === Object) {
      console.log('No tasks found')
    } else {
      tasks = result.tasks
      $('#taskList').empty()
      $('#newTask').val('')
      $('#taskDue').val(formatDate())
      $('#addTaskClass').empty().append(`<option selected>Class...(default to misc)</option>`)
      for (let key in tasks) {
        if(tasks.hasOwnProperty(key)) {
          if(tasks[key].length != 0) {
            $('#taskList').append($('<h5></h5>').text(key))
            tasks[key].sort((a, b) => -1 * (new Date(b[1]) - new Date(a[1])))
            for (let i = 0; i < tasks[key].length; i++) {
              $('#newTaskSelectionGroup').addClass('mb-3')
              $('#taskList')
                .append($('<div></div>')
                  .addClass('custom-control custom-checkbox mb-2')
                  .attr('id', `${key.replace(' ', '_') + i}`)
                  .append($('<input>')
                    .attr('type', 'checkbox')
                    .addClass('custom-control-input')
                    .attr('data-del', `${key.replace(' ', '_') + i}`)
                    .attr('data-class', `${key.replace(' ', '_')}`)
                    .attr('id', `check${key.replace(' ', '_') + i}`),
                     $('<label></label>')
                    .addClass('custom-control-label')
                    .attr('id', `label${key.replace(' ', '_') + i}`)
                    .attr('for', `check${key.replace(' ', '_') + i}`)
                  )
                )
              let dueDate = new Date(tasks[key][i][1] + 'T00:00:00')
              let dueDeltaDay = Math.floor((dueDate - new Date)/(1000*60*60*24)+1)
              if(tasks[key][i][1] == '') {
                $(`#label${key.replace(' ', '_') + i}`).text(tasks[key][i][0])
              } else {
                // ddd <= 0
                // ddd < -1
                // ddd == -1
                // ddd == 0
                // ddd == 1
                // 2 <= ddd <= 14
                // ddd > 14
                $(`#label${key.replace(' ', '_') + i}`).html(tasks[key][i][0] + `<i class="far fa-clock ml-1 ${dueDeltaDay <= 0 ? 'text-danger' : ''}" id="tooltip${key.replace(' ', '_') + i}"></i>`).attr({ 'data-has-date': 'true', 'data-due-on': dueDate })
                $(`#tooltip${key.replace(' ', '_') + i}`).tooltip(tooltipBuilder(dueDate, dueDeltaDay))
                $(document).on('click', `#tooltip${key.replace(' ', '_') + i}`, (e) => {
                  e.preventDefault()
                })
              }
            }
          }
        }
      }

      $('[data-del]').on('change paste keyup', function() {
        let button = $(this)
        let target = button.data('del')
        let index;
        if (!(typeof $(`#${target} label`).attr('data-has-date') !== typeof undefined && $(`#${target} label`).attr('data-has-date') !== false)) {
          index = getIndexOfArray(tasks[button.data('class').replace('_', ' ')], [$(`#${target} label`).text(), ''])
        } else {
          let dateFormatted = new Date($(`#${target} label`).attr('data-due-on'))
          dateFormatted = dateFormatted.getFullYear() + '-' + (dateFormatted.getMonth() + 1).toString().padStart(2, "0") + '-' + (dateFormatted.getDate()).toString().padStart(2, "0")
          index = getIndexOfArray(tasks[button.data('class').replace('_', ' ')], [$(`#${target} label`).text(), dateFormatted])
        }
        if(index > -1) {
          lastTask = [button.data('class').replace('_', ' '), tasks[button.data('class').replace('_', ' ')][index]]
          tasks[button.data('class').replace('_', ' ')].splice(index, 1)
          chrome.storage.sync.set({tasks: tasks}, function() {
            $('#undo-task-delete').remove()
            $('#todo .card-title').append(`<a href="" data-toggle="modal" class="btn btn-primary btn-sm float-right" id="undo-task-delete" data-task="${lastTask}">Undo</a>`)
            loadTasks()
          })
        }
      })
    }
  })

  chrome.storage.sync.get(['classes'], function(result) {
    if(Object.keys(result).length === 0 && result.constructor === Object) {
      console.log('Classes not found')
    } else {
      console.log('Class list found')
      console.log(result.classes)
      let classes = result.classes
      for(let i = 0; i < classes.length; i++) {
        $('#addTaskClass').append($('<option></option>').attr('value', classes[i]).html(classes[i]))
        if(tasks[classes[i]] == undefined) {
          tasks[classes[i]] = []
        }
      }
    }
    $('#addTaskClass').append($('<option></option>').attr('value', 'Miscellaneous').html('Miscellaneous'))
    if(tasks['Miscellaneous'] == undefined) {
      tasks['Miscellaneous'] = []
    }
  })
}

function getIndexOfArray(origArr, newArr) {
  newArr[1].replace('/', '-')
  for(i = 0; i < origArr.length; i++) {
    if(origArr[i][0] == newArr[0]) {
      if(origArr[i][1] == newArr[1]) {
        return i
      }
    }
  }
}
// ddd < -1
// ddd == -1
// ddd == 0
// ddd == 1
// 2 <= ddd <= 14
// ddd > 14
function tooltipBuilder(date, delta) {
  let dueString
  if(delta < -1) {
    dueString = `Was due ${Math.abs(delta)} days ago`
  } else if(delta == -1) {
    dueString = `Was due yesterday`
  } else if (delta == 0) {
    dueString = `Due today`
  } else if (delta == 1) {
    dueString = `Due tomorrow`
  } else if (delta >= 2 && delta < 7) {
    dueString = `Due on ${moment().add(delta, 'days').format('dddd')} (${moment().add(delta, 'days').format('M/D')})`
  } else if (delta >= 7 && moment().add(delta, 'days').isBefore(moment().add(1, 'month').startOf('month'))) {
    dueString = `Due on the ${moment().add(delta, 'days').format('Do')} (${moment().add(delta, 'days').format('M/D')})`
  } else {
    dueString = `Due on ${moment().add(delta, 'days').format('MMM Do')}`
  }

  return {
    title: dueString,
    placement: 'right',
    template: `<div class="tooltip ${delta <= 0 ? 'warning' : ''}" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>`
  }
}

function defaultController() {
  $('#settings-close').click( function() {
    chrome.storage.sync.set({'todoDate': $('#todo-default').val()})
  })
}

function formatDate() {
  let date = moment()
  if(todoDefault === 'Tomorrow') {
    if(date.day() === 6) {
      date.add(2, 'days')
    }else if(date.day() === 5) {
      date.add(3, 'days')
    }else {
      date.add(1, 'days')
    }
  }else if(todoDefault === 'Week') {
    date.add(7, 'days')
  }
  let dateComps = date.format('L').split('/')
  return dateComps[2] + '-' + dateComps[0] + '-' + dateComps[1]
}
