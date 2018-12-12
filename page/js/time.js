var sched
var isSpecial = false
let block
let bell2
let letter
chrome.storage.sync.get( ['bell2'], function({bell2}) {
  if(bell2) {
    $('#bell-2-check').prop('checked', true)
  } else {
    $('#bell-2-check').prop('checked', false)
  }
})

$.getJSON(`http://manage.waytab.org/modules/schedule/?timestamp=${moment().subtract(1, 'days').unix()}`, (data) => {
  console.log(data)
  if (data.name !== undefined && Math.abs(moment(data.date).diff(moment(), 'd')) < 1) {
    sched = data.schedule
    isSpecial = true
    displayTime()
    updateBlock()
  } else {
    $.getJSON('js/json/config.json', (data) => {
      sched = data.bell_schedule
      isSpecial = false
      displayTime()
      updateBlock()
    }).fail((err) => {
      console.log(err)
    })
  }
})

hoverController()
bellTwoController()

$(document).ready( function() {
  console.log(sched)
  daySelectController()
  if(getTodaySchedule() != 4) {
    chrome.storage.sync.get('day', function({day}) {
      let data = day // parse response
      let dateComp = moment().format('L').split('/') // create date array
      let currDate = dateComp[2] + '-' + dateComp[0] + '-' + dateComp[1] // build moment-compatible string
      let dayDiff = moment(currDate).diff(moment(data[1]), 'days') // calculate difference in days
      let currCol = letterToCol(data[0]) // get 'current' col number
      let correctCol = currCol + dayDiff
      if(correctCol > 7) {
        correctCol = correctCol % 7 - 1
      }
      let correctLetter = colToLetter(correctCol) // get 'correct' (shifted) letter
      letter = correctLetter
    })
  }
})

setInterval( () => {
  displayTime()
  barController()
  updateBlock()
}, 1000)

function updateBlock() {
  block = getCurrentBlock()
  highlightBlock()
}

function displayTime() {
  try {
    if(getTodaySchedule() != 4 && letter !== undefined) {
      $('#time-container').html(`<span id="time-display">${moment().format('h:mm:ss')}</span>${moment().format('a')} | ${letter} Day | ${block.name}`)
    }else {
      $('#time-container').html(`<span id="time-display">${moment().format('h:mm:ss')}</span>${moment().format('a')} | ${block.name}`)
    }
  } catch(e) {
  }
}

function barController() {
  let periodLength = moment(block.end,'hmm').diff(moment(block.start,'hmm'), 'minutes')
  let elapsed = moment().diff(moment(block.end, 'hmm')) / 1000 / 60
  let percentElapsed = 100 - (-1 * elapsed / periodLength) * 100

  $('#time-bar-elapsed').css('width', percentElapsed + '%')
  $('#percent-container').text('Ends at ' + moment(block.end, 'hmm').format('h:mm a') + ' | ' + parseInt(percentElapsed) + '% elapsed')
  $('#time-container').css('color', percentElapsed <= 50 ? 'black' : 'white')
}

function bellTwoController() {
  $('#bell-2-check').change( function() {
    if(this.checked) {
      bell2 = true
      chrome.storage.sync.set( {'bell2': true}, function() {
      })
      block = sched['2'][getSoonestIndex('2')]
    } else {
      bell2 = false
      chrome.storage.sync.set( {'bell2': false}, function() {
      })
      block = getCurrentBlock()
    }
  })
}

function hoverController() {
  let bar = document.getElementById('time-bar-total');
  let percentContainer = document.getElementById('percent-container')
  bar.onmouseover = function() {
    percentContainer.style.display = 'block';
  }
  bar.onmouseout = function() {
    percentContainer.style.display = 'none';
  }


  percentContainer.onmouseover = function() {
    percentContainer.style.display = 'block';
  }
  percentContainer.onmouseout = function() {
    percentContainer.style.display = 'none';
  }
}

function getCurrentBlock() {
  if(!isSpecial) {
    return sched[getTodaySchedule()][getSoonestIndex(getTodaySchedule())]
  }else {
    return sched[getSoonestIndex(null)]
  }
}

function highlightBlock() {
  if(block.name.includes('Block')) {
    let actualBlock = parseInt(block.name.substring(block.name.length - 1))
    if(actualBlock <= 6) {
      $('.now').removeClass('now')
      if(letter !== undefined) {
        let table = $('#schedule-body')[0]
        let cell = table.rows[actualBlock-1].cells[letterToCol(letter)]
        let child = $(cell)
        $(child).addClass('now')
      }else {
        $('#schedule-body').children().each( function() {
          if($(this).attr('data-per') == actualBlock) {
            $(this).children().addClass('now')
          }
        })
      }
    }
  }
}

function daySelectController() {
  $(document).on('click', '.daySelect', function() {
    let dateComp = moment().format('L').split('/')
    let formattedDate = dateComp[2] + '-' + dateComp[0] + '-' + dateComp[1]
    console.log(formattedDate)
    chrome.storage.sync.set( {'day': [$(this).attr('data-day'), formattedDate]} )
    letter = $(this).attr('data-day')
  })
}

function getTodaySchedule() {
  switch(moment().format('e')) {
    case '0':
      return 4
      break
    case '3':
      return 3
      break
    case '6':
      return 4
      break
    default:
      return 1
      break
  }
}

function letterToCol(day) {
  switch(day) {
    case 'A':
      return 0
      break
    case 'B':
      return 1
      break
    case 'C':
      return 2
      break
    case 'D':
      return 3
      break
    case 'E':
      return 4
      break
    case 'F':
      return 5
      break
    case 'G':
      return 6
      break
    case 'H':
      return 7
      break
    default:
      return -1
      break
  }
}

function colToLetter(col) {
  switch(col) {
    case 0:
      return 'A'
      break
    case 1:
      return 'B'
      break
    case 2:
      return 'C'
      break
    case 3:
      return 'D'
      break
    case 4:
      return 'E'
      break
    case 5:
      return 'F'
      break
    case 6:
      return 'G'
      break
    case 7:
      return 'H'
      break
    default:
      return 'Z'
      break
  }
}

function getSoonestIndex(todaySchedule) {
  let bell
  if(!isSpecial) {
    bell = sched[todaySchedule]
  }else {
    bell = sched
  }
  let currentMin = Number.MAX_SAFE_INTEGER
  let ret = 0
  for(i = 0; i < bell.length; i++) {
    let diff = moment().diff(moment(bell[i].start, 'hmm'))
    if(diff > 0 && diff <= currentMin) {
      ret = i
      currentMin = diff
    }
  }
  return ret
}
