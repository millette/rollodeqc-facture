(function() {
  /* global pdfMake*/
  'use strict';

  var r;

  var formEl = document.getElementsByTagName('form')[0];
  var devisDateEl = document.getElementsByName('devisDate')[0];
  var addItemEl = document.getElementById('addItem');
  var downloadEls = formEl.querySelectorAll('button.download-btn');
  var imageEls = formEl.querySelectorAll('input[type=file]');

  var makeInput = function(cnt, label, name, type) {
    var labelEl = document.createElement('label');
    var inputEl = document.createElement('input');

    if (type === undefined) { type = 'text'; }
    if (name === undefined) { name = label; }
    inputEl.setAttribute('name', name + '[]');
    inputEl.setAttribute('type', type);
    labelEl.appendChild(document.createTextNode(label + ': '));
    labelEl.appendChild(inputEl);
    return labelEl;
  };

  var addItemForm = function() {
    var cnt = formEl.querySelectorAll('fieldset.project').length;
    var fieldSetEl = document.createElement('fieldset');
    var legendEl = document.createElement('legend');
    var inputProjetEl = makeInput(cnt, 'projet');
    var inputDescriptionEl = makeInput(cnt, 'description');
    var inputCoutEl = makeInput(cnt, 'coût', 'cout', 'number');
    var detailsEl = document.createElement('label');
    var detailsTextareaEl = document.createElement('textarea');

    detailsTextareaEl.setAttribute('name', 'details[]');
    detailsTextareaEl.setAttribute('rows', 5);
    detailsEl.appendChild(document.createTextNode('détails: '));
    detailsEl.appendChild(detailsTextareaEl);
    legendEl.innerHTML = 'Item #' + (cnt + 1);
    fieldSetEl.setAttribute('class', 'project');
    fieldSetEl.appendChild(legendEl);
    fieldSetEl.appendChild(inputProjetEl);
    fieldSetEl.appendChild(inputDescriptionEl);
    fieldSetEl.appendChild(inputCoutEl);
    fieldSetEl.appendChild(detailsEl);
    formEl.insertBefore(fieldSetEl, addItemEl);
  };

  var roundCorner = function(ctx, round, width, height) {
    if (!round) { return; }
    ctx.beginPath();
    ctx.moveTo(0 + round, 0);
    ctx.lineTo(0 + width - round, 0);
    ctx.quadraticCurveTo(0 + width, 0, 0 + width, 0 + round);
    ctx.lineTo(0 + width, 0 + height - round);
    ctx.quadraticCurveTo(0 + width, 0 + height, 0 + width - round, 0 + height);
    ctx.lineTo(0 + round, 0 + height);
    ctx.quadraticCurveTo(0, 0 + height, 0, 0 + height - round);
    ctx.lineTo(0, 0 + round);
    ctx.quadraticCurveTo(0, 0, 0 + round, 0);
    ctx.closePath();
    ctx.clip();
  };

/*
  var getBase64FromImageUrlFake = function(url, options, cb) {
    roundCorner();
    if (cb) { cb(); }
    else { options(); }
  };
*/

  var getBase64FromImage = function(image, options, cb) {
    var img = new Image();

    img.onload = function () {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var defaults = {
        bg: false,
        round: Math.min(this.width, this.height) / 4,
        co: false
      };

      if (!cb) {
        cb = options;
        options = defaults;
      }
      if (options.round === undefined) { options.round = defaults.round; }
      canvas.width = this.width;
      canvas.height = this.height;
      roundCorner(ctx, options.round, this.width, this.height);
      if (options.bg) {
        ctx.fillStyle = options.bg;
        ctx.fillRect(0, 0, this.width, this.height);
      }
      if (options.co) { ctx.globalCompositeOperation = options.co; }
      ctx.drawImage(this, 0, 0);
      cb(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

/*
  var getBase64FromImageUrl = function(url, options, cb) {
    var img = new Image();

    img.onload = function () {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var defaults = {
        bg: false,
        round: Math.min(this.width, this.height) / 4,
        co: false
      };

      if (!cb) {
        cb = options;
        options = defaults;
      }
      if (options.round === undefined) { options.round = defaults.round; }
      canvas.width = this.width;
      canvas.height = this.height;
      roundCorner(ctx, options.round, this.width, this.height);
      if (options.bg) {
        ctx.fillStyle = options.bg;
        ctx.fillRect(0, 0, this.width, this.height);
      }
      if (options.co) { ctx.globalCompositeOperation = options.co; }
      ctx.drawImage(this, 0, 0);
      cb(canvas.toDataURL('image/png'));
    };
    img.src = url;
  };
*/

  var parseDetails = function(details) {
    var ret = [];

    details.split('\n\n').forEach(function (part) {
      var prefix = part.slice(0, 2);
      var listItems = [];
      var list = {};

      if (prefix === '* ' || prefix === '# ') {
        part.split('\n').forEach(function (item) { listItems.push(item.slice(2)); });
        list[prefix === '* ' ? 'ul' : 'ol'] = listItems;
        ret.push(list);
      } else { ret.push(part); }
    });
    return ret;
  };

  var dateFrench = function(d) {
    var months = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre'
    ];
    var units = [];

    if (d === undefined) { d = new Date(); }
    units.push(d.getDate());
    units.push(months[d.getMonth()]);
    units.push(d.getFullYear());
    return units.join(' ');
  };

  var devisFilename = function(data) {
    return '#' + data.devisNum + ' ' + data.devisTitre + '.pdf';
  };

  var fromDefaults = function(data) {
    return Object.assign({
      consultant: '[nom-consultant]',
      client: '[nom-client]',
      devisTitre: '[titre-devis]',
      devisNum: '[numero-devis]',
      devisDate: '[date-devis]',
      conditions: '[conditions]',
      consultantLong: '[adresse-consultant]',
      clientLong: '[adresse-client]',
      notes: '[notes]',
      projet: [],
      singlePage: false,
      marginWidth: 60,
      marginHeight: 140
    }, data);
  };

  var updatePdf = function(data, download) {
    var tableBody = [[
      { text: '#', style: 'tableHeader'},
      { text: 'Projet', style: 'tableHeader'},
      { text: 'Description', style: 'tableHeader'},
      { text: 'Coût', style: 'tableHeader', alignment: 'right' }
    ]];
    var notesHeader = [ '\n', { style: 'header', text: 'Notes' } ];
    var annexe = [ { style: 'header', text: 'Annexe' } ];
    var pageSize = 'LETTER';
    var currency = ' $';
    var items = [];
    var consultant, extraMargin, coutTotal, docDefinition, pdf;

    data = fromDefaults(data);

    extraMargin = [
      data.marginWidth,
      data.marginHeight / 2,
      data.marginWidth,
      data.marginHeight / 2
    ];

    consultant = [
      { width: 'auto', text: data.consultant + '\n' + data.consultantLong }
    ];

    data.projet.forEach(function (projet, n) {
      items.push({
        projet: projet,
        description: data.description[n],
        cout: parseInt(data.cout[n], 10) || 0,
        details: parseDetails(data.details[n])
      });
    });

    coutTotal = 0;
    items.forEach(function (item) {
      coutTotal += item.cout;
      tableBody.push([
        '' + tableBody.length,
        item.projet,
        item.description,
        { text: item.cout + currency, bold: true, alignment: 'right' }
      ]);
    });

    tableBody.push([
      '',
      { text: 'Les détails se trouvent en annexe', italic: true},
      { alignment: 'right', text: 'Total', style: 'tableHeader' },
      { alignment: 'right', text: coutTotal + currency, style: 'tableHeader' }
    ]);

    //getBase64FromImageUrlFake('images/logo.png', function (image) {
    if (data.consultantLogo && data.consultantLogo.value) {
      consultant.push({ image: data.consultantLogo.value, alignment: 'right' });
    }
    docDefinition = {
      header: {
        margin: extraMargin,
        columns: [
          {
            width: 'auto',
            text: 'Devis de ' + data.consultant + ' pour ' + data.client,
            style: 'extra'
          },
          { text: data.devisDate, alignment: 'right' }
        ]
      },
      footer: function (current, pages) {
        return {
          margin: extraMargin,
          columns: [
            { text: 'Devis #' + data.devisNum, style: 'extra' },
            { text: 'Page ' + current + ' de ' + pages, alignment: 'right'}
          ]
        };
      },
      pageSize: pageSize,
      pageMargins: [ data.marginWidth, data.marginHeight, data.marginWidth, data.marginHeight ],
      content: [
        { columns: consultant },
        { text: data.clientLong, alignment: 'right' },
        '\n',
        { text: 'Devis', style: 'header' },
        { text: data.devisTitre, style: 'header2' },
        'numéro de devis: ' + data.devisNum,
        '\n',
        {
          table: {
            headerRows: 1,
            widths: ['5%', '40%', '40%', '15%'],
            body: tableBody
          }
        },
        '\n'
      ],
      styles: {
        header: { fontSize: 22, bold: true },
        header2: { fontSize: 18, bold: true },
        extra: { fontSize: 15 },
        tableHeader: { bold: true, fontSize: 15 }
      }
    };

    if (!data.singlePage) { annexe[0].pageBreak = 'before'; }
    items.forEach(function (item, n) {
      var anx = [ { text: (n + 1) + '. ' + item.projet, style: 'header2' } ];

      item.details.forEach(function (paragraph) {
        anx.push(paragraph);
        anx.push('\n');
      });
      annexe.push(anx);
    });
    docDefinition.content = docDefinition.content.concat(
      data.conditions, '\n', annexe, notesHeader, data.notes);
    pdf = pdfMake.createPdf(docDefinition);
    if (download) { pdf.download(devisFilename(data)); }
    else { pdf.getDataUrl(function (outDoc) {
      document.getElementById('pdfV').src = outDoc;
    }); }
    //});
  };

  var formSubmit = function(download, event) {
    var ret = {};
    var stuff = formEl.querySelectorAll('*[name]');
    var name, trimmed, value;

    if (event) { event.preventDefault(); }
    for (r = 0; r < stuff.length; ++r) {
      if (stuff[r].files && stuff[r].files[0]) {
        ret[stuff[r].name] = stuff[r].files[0];
      } else {
        trimmed = stuff[r].value.trim();
        if (stuff[r].name.indexOf('[]') === stuff[r].name.length - 2) {
          name = stuff[r].name.slice(0, -2);
          value = trimmed || ('[' + name + ']');
          if (ret[name] === undefined) { ret[name] = [value]; }
          else { ret[name].push(value); }
        } else if (trimmed) {
          if (stuff[r].type === 'checkbox') {
            ret[stuff[r].name] = stuff[r].checked;
          } else if (stuff[r].type === 'number') {
            ret[stuff[r].name] = parseInt(trimmed, 10);
          } else { ret[stuff[r].name] = trimmed; }
        }
      }
    }
    console.log('RET:', ret);
    updatePdf(ret, download);
  };

  var uploadImage = function(event) {
    var file = event.target.files[0];
    var imageUrl;
//    var reader;

    if (!file.type.match(/^image\//)) {
      throw new Error('');
    }

    //console.log('IMAGE (1)', file);
    imageUrl = URL.createObjectURL(file);
    getBase64FromImage(imageUrl, function (a) {
      event.target.files[0].value = a;
    });

/*
    console.log('imageUrl', imageUrl);
    reader = new FileReader();
    reader.onloadend = (function(a) {
      console.log('A', a);
      return function(e) {
        // ...
        console.log('E', e);
        //delete event.target.files;
      };
    }(file));
    reader.readAsDataURL(file);
*/
  };

  devisDateEl.value = dateFrench();
  formEl.addEventListener('submit', formSubmit.bind(null, false));
  addItemEl.addEventListener('click', addItemForm);
  for (r = 0; r < downloadEls.length; ++r) {
    downloadEls[r].addEventListener('click', formSubmit.bind(null, true));
  }
  for (r = 0; r < imageEls.length; ++r) {
    imageEls[r].addEventListener('change', uploadImage);
  }
  addItemForm();
  formSubmit();
}());
