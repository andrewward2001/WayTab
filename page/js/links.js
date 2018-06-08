export class Links {
  constructor() {
    let linksFunc = this.loadLinks
    let addFunc = this.addLink;
    let removFunc = this.enableRemove;
    chrome.storage.sync.get(['links'], function(result) {
      if(Object.keys(result).length === 0 && result.constructor === Object) {
        $.getJSON('js/json/config.json', (data) => {
          chrome.storage.sync.set({links: data.saved_tabs}, () => {
            linksFunc(data.saved_tabs)
          })
        })
      } else {
        linksFunc(result.links);
      }
    })
    addFunc(linksFunc);
    removFunc();
  }

  loadLinks(obj) {
    for(let i = 0; i < obj.length; i++) {
      $('#link-container').append($('<div></div>').addClass('col-1').attr('id', `link${i}`))
      $(`#link${i}`).append($('<a></a>').addClass('img-link').attr('href', obj[i].actual_link).append($('<img />').attr({ src: obj[i].image_link, alt: obj[i].id })))
      $(`#link${i}`).append($('<div>X</div>').addClass('tab-delete-button').attr('id', `delete${i}`))
    }
    $('#link-container').prepend($('<div></div>').addClass('col')).append($('<div></div>').addClass('col'))
  }

  addLink(loadFunc) {
    $(document).on('click', '#submit-tab-info', () => {
      let name = $('#tab-name').val();
      let link = $('#tab-link').val();
      let img = $('#img-upload').val();
      if(img.length <= 8) {
        img = './img/default.png'
      }
      let obj = [{"name": name, "actual_link": link, "image_link": img}];
      loadFunc(obj);

      chrome.storage.sync.get(['links'], function(result) {
        console.log(result.links);
        result.links.push(obj);
        chrome.storage.sync.set({links: result.links}, () => {});
      });
    });
  }

  enableRemove() {
    $(document).on('click', '#remove-button', () => {
      if($('#remove-button').attr('aria-expanded') === "true") {
        $('#link-container .col-1').each(function(index) {
          $('#delete'+index).css('display', 'block');
          $('#delete'+index).on('click', () => {
            $(`#link${index}`).remove();
            chrome.storage.sync.get(['links'], function(result) {
              result.links.splice(index, 1);
              chrome.storage.sync.set({links: result.links}, () => {});
            });
          });
        });
      }else {
        $('#link-container .col-1').each(function(index) {
          $('#delete'+index).css('display', 'none');
        });
      }
    })
  }
}
