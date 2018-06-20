let wspnrss = 'http://waylandstudentpress.com/feed/'
let articles = []

$.ajax({
  type: 'GET',
  url: 'https://cors-anywhere.herokuapp.com/' + wspnrss,
  dataType: 'xml',
  success: function(xml) {
    let lim = 5

    $(xml).find('item').each(function (index) {
      if(index < lim) {
        let title = $(this).find('title').text()
        let link = $(this).find('link').text()
        let bod = $('<div></div>').append($(this).find('description').text())
        let desc = $(this).find($('p')).first().text()
        console.log(desc)
        let img = $(bod).find('img').attr('src')
        if(img == undefined) {
          img = 'https://cdn3.iconfinder.com/data/icons/web-development-and-programming-2/64/development_Not_Found-512.png'
        }
        articles.push([title, link, img]);
      }
    })

    displayArticles();
  }
})

$(document).ready(() => {
  controlFlow();
})

function controlFlow() {
  $(document).on('click', '#show-wspn', () => {
    $('#wspn-container').css('width', '332px');
  })

  $(document).on('click', '#close-wspn', () => {
    $('#wspn-container').css('width', '0px');
  })
}

function displayArticles() {
  for(i = 0; i < articles.length; i++) {
    let title = articles[i][0];
    let link = articles[i][1];
    let img = articles[i][2];
    console.log(title + " | " + link + " | " + img)
    $('#rss-feed').append(createNewsDiv(title, link, img));
  }
}

function createNewsDiv(title, link, img) {
  let newsdiv = $('<div></div>')
    .attr('class', 'wspn-article mb-5')
    .attr('id', `article${i+1}`)
    .css('padding-left', '1rem')
    .append($('<a></a>')
      .attr('href', link)
      .attr('id', `article-link${i+1}`)
      .append($('<img></img>')
        .attr('src', img)
        .attr('alt', title)
        .attr('id', `article-image${i+1}`)
        .attr('width', '300px')
        .attr('height', '200px')
      )
      .append($('<h6></h6>').text(title).css('padding-left', '5px').css('color', '#000'))
    )
  return newsdiv;
}
