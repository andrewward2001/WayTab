resetController()

function resetController() {
  hardResetTasks()
  hardResetSchedule()
  hardResetWaytab()
}

function hardResetTasks() {
  $(document).on('click', '#force-reset-tasks', function() {
    chrome.storage.sync.get('tasks', function({tasks}) {
      if(tasks !== null) {
        Object.keys(tasks).forEach( function(obj) {
          // I console log all of the task NAMES so that they can re-enter assignments after the reset
          console.log(obj + ':')
          for(i = 0; i < this.length; i++) {
            console.log(this[i][0])
          }
          console.log('-----')
        })
      }
    })
    chrome.storage.sync.set({tasks: {}}, function() {
    })
    $('#taskList').empty()
  })
}

function hardResetSchedule() {
  $(document).on('click', '#force-reset-schedule', function() {
    chrome.storage.sync.set({schedule: {}}, function() {
    })
    $('#schedule-table').remove()
  })
}

function hardResetWaytab() {
  $(document).on('click', '#force-reset-waytab', function() {
    chrome.storage.sync.clear(() => {
      chrome.storage.sync.set({
        title: 'WayTab',
        font: 'default',
        enableWspn: true
      }, () => {
        location.reload()
      })
    })
  })
}

$('#feedback').tooltip({
  placement: 'top',
  title: 'Feedback'
})

$(document).on('click', '#feedback', () => {
  $('#feedback-settings').tab('show')
})
