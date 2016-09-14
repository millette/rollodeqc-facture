(function() {
  /* global pdfMake Locally*/
  'use strict';

  var r;

  var store = new Locally.Store();
  var consultantEl = document.getElementsByName('consultant')[0];
  var consultantLongEl = document.getElementsByName('consultantLong')[0];
  //var consultantLogoEl = document.getElementsByName('consultantLogo')[0];

  var clientEl = document.getElementsByName('client')[0];
  var clientLongEl = document.getElementsByName('clientLong')[0];
  //var clientLogoEl = document.getElementsByName('clientLogo')[0];


  var formEl = document.getElementsByTagName('form')[0];
  var titleEl = document.getElementsByTagName('title')[0];
  var factureDateEl = document.getElementsByName('factureDate')[0];
  var addItemEl = document.getElementById('addItem');
  var downloadEls = formEl.querySelectorAll('button.download-btn');
  var imageEls = formEl.querySelectorAll('input[type=file]');

  var makeInput = function(label, name, type) {
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

  var addItemForm = function(init) {
    var fieldSetEl = document.createElement('fieldset');
    var legendEl = document.createElement('legend');
    var inputProjetEl = makeInput('projet');
    var inputDescriptionEl = makeInput('description');
    var inputCoutEl = makeInput('coût', 'cout', 'number');
    var detailsEl = document.createElement('label');
    var detailsTextareaEl = document.createElement('textarea');
    var deleteEl = document.createElement('button');

    deleteEl.innerHTML = '[X]';
    deleteEl.addEventListener('click', function(event) {
      event.preventDefault();
      if (formEl.querySelectorAll('fieldset.project').length > 1) {
        formEl.removeChild(event.target.parentNode);
      }
    });

    deleteEl.setAttribute('class', 'delete-btn');
    detailsTextareaEl.setAttribute('name', 'details[]');
    detailsTextareaEl.setAttribute('rows', 5);
    detailsEl.appendChild(document.createTextNode('détails: '));
    detailsEl.appendChild(detailsTextareaEl);
    legendEl.innerHTML = 'Item';
    fieldSetEl.setAttribute('class', 'project');
    fieldSetEl.appendChild(legendEl);
    fieldSetEl.appendChild(deleteEl);
    fieldSetEl.appendChild(inputProjetEl);
    fieldSetEl.appendChild(inputDescriptionEl);
    fieldSetEl.appendChild(inputCoutEl);
    fieldSetEl.appendChild(detailsEl);
    formEl.insertBefore(fieldSetEl, addItemEl);
    if (!init) { inputProjetEl.focus(); }
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

  var factureFilename = function(data, extension) {
    if (extension === undefined) { extension = '.pdf'; }
    return '#' + data.factureNum + ' ' + data.factureTitre + extension;
  };

  //RYM
  var savePreset = function(data, preset) {
    var x = store.get(preset) || {};

    //console.log('FUNCTION: savePreset()')
    //console.log('X (1):', preset, x);


    if (preset === 'consultant') {
      //console.log('IF');
      if (!data.consultant) { return; }
      //console.log('GO ON', data);

      x[data.consultant] = { adresse: data.consultantLong };
      ////console.log('consultantLogo', data.consultantLogo);
      //RYM
      if (data.consultantLogo) { // && data.consultantLogo.value) {
        //console.log('data.consultantLogo:', data.consultantLogo);
        x[data.consultant].logo = data.consultantLogo;//.getAttribute('data-img');//.value;
      //} else if () {
        //x[data.consultant].logo =
      }
    } else if (preset === 'client') {
      if (!data.client) { return; }
      x[data.client] = { adresse: data.clientLong };
      //if (data.clientLogo && data.clientLogo.value) {
        //x.logo = data.clientLogo.value;
      //}
    } else { return; }

    //console.log('X (2):', preset, x);
    store.set(preset, x);
  };

  var fromDefaults = function(data) {
    return Object.assign({
      consultant: '[nom-consultant]',
      client: '[nom-client]',
      factureTitre: '[titre-facture]',
      factureNum: '[numero-facture]',
      factureDate: '[date-facture]',
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

  var downloadJson = function(filename, docDefinition) {
    var saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    var event = document.createEvent('MouseEvents');

    saveLink.href = 'data:application/json;charset=utf8,' +
      encodeURIComponent(JSON.stringify(docDefinition, null, ' '));

    saveLink.download = filename;
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0,
      false, false, false, false, 0, null);
    saveLink.dispatchEvent(event);
  };

  var factureTitle = function(data) {
    return 'Facture de ' + data.consultant + ' pour ' + data.client;
  };

  //RYM
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
    var client = { stack: [], alignment: 'right', width: '*' };
    var consultant = { stack: [], width: '*' };
    var extraMargin, coutTotal, docDefinition, pdf;

    //console.log('FUNCTION: updatePdf()')

    //RYM
    //console.log('DATA', data);
    savePreset(data, 'consultant');
    savePreset(data, 'client');

    data = fromDefaults(data);

    titleEl.innerHTML = factureTitle(data);

    extraMargin = [
      data.marginWidth,
      data.marginHeight / 2,
      data.marginWidth,
      data.marginHeight / 2
    ];

    if (data.consultantLogo) { // && data.consultantLogo.value) {
      consultant.stack.push({ image: data.consultantLogo/*.value*/, width: 200 });
    }
    consultant.stack.push(data.consultant);
    consultant.stack.push(data.consultantLong);

    if (data.clientLogo && data.clientLogo.value) {
      client.stack.push({ image: data.clientLogo.value, width: 200 });
    }
    client.stack.push(data.client);
    client.stack.push(data.clientLong);

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

    docDefinition = {
      header: {
        margin: extraMargin,
        columns: [
          {
            width: 'auto',
            text: factureTitle(data),
            style: 'extra'
          },
          { text: data.factureDate, alignment: 'right' }
        ]
      },
      footer: function (current, pages) {
        return {
          margin: extraMargin,
          columns: [
            { text: 'Facture #' + data.factureNum, style: 'extra' },
            { text: 'Page ' + current + ' de ' + pages, alignment: 'right'}
          ]
        };
      },
      pageSize: pageSize,
      pageMargins: [ data.marginWidth, data.marginHeight, data.marginWidth, data.marginHeight ],
      content: [
        { columns: [ consultant, client ] },
        '\n',
        { text: 'Facture', style: 'header' },
        { text: data.factureTitre, style: 'header2' },
        'numéro de facture: ' + data.factureNum,
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

    if (download === 'json') {
      downloadJson(factureFilename(data, '.json'), docDefinition);
    } else {
      pdf = pdfMake.createPdf(docDefinition);
      if (download === 'pdf') { pdf.download(factureFilename(data)); }
      else { pdf.getDataUrl(function (outDoc) { document.getElementById('pdfV').src = outDoc; }); }
    }
  };

  //RYM
  var formSubmit = function(download, event) {
    var ret = {};
    var stuff = formEl.querySelectorAll('*[name]');
    //var y = store.get('consultant');
    var name, trimmed, value, x;

    //console.log('FUNCTION: formSubmit()')
    if (event) { event.preventDefault(); }
    for (r = 0; r < stuff.length; ++r) {
      if (stuff[r].type === 'button') { continue; }
      if (stuff[r].files && stuff[r].files[0]) {

        //HERE
        if (stuff[r].name === 'consultantLogo') {
          x = stuff[r].getAttribute('data-img');
          //x = consultantLogoEl.getAttribute('data-img');
        } else if (stuff[r].name === 'clientLogo') {
          //clientLogoEl.setAttribute('data-img', img);
        } else {
          x = false;
          //y = ;
        }

        //event.target.files[0].setAttribute('data-img', img);
        //event.target.files[0].value = img;
        //x = stuff[r].files[0].getAttribute('data-img');
        if (x) {
          //console.log('X (666)', ret[stuff[r].name], x, r, stuff[r].name);
          ret[stuff[r].name] = x;
        }
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
    //RYM
    updatePdf(ret, download);
  };

  var consultantBlur = function(type) {
    // delayed because it's triggered before the onclick event
    setTimeout(function () {
      var vavoomEl = document.getElementById('vavoom-' + type);
      if (vavoomEl) { vavoomEl.style.display = 'none'; }
    }, 150);
  };

  //RYM
  var pickConsultant = function(type, event) {
    var vavoomEl = document.getElementById('vavoom-' + type);
    var consultantsObj = store.get(type);

    //console.log('FUNCTION: pickConsultant()')

    //console.log('X (3):', type, consultantsObj);

    event.preventDefault();
    vavoomEl.style.display = 'none';
    if (type === 'consultant') {
      consultantEl.value = event.target.innerHTML;
      consultantLongEl.value = consultantsObj[event.target.innerHTML].adresse || '';

      ////console.log('consultantsObj[event.target.innerHTML]', consultantsObj[event.target.innerHTML]);
/*
      if (consultantsObj[event.target.innerHTML].logo) {
        consultantLogoEl.setAttribute('data-img', consultantsObj[event.target.innerHTML].logo);
//        consultantLogoEl.value = consultantsObj[event.target.innerHTML].logo.value;
//        //console.log('consultantLogoEl', consultantLogoEl);
      }
*/
      //data.consultantLogo
    } else if (type === 'client') {
      clientEl.value = event.target.innerHTML;
      clientLongEl.value = consultantsObj[event.target.innerHTML].adresse || '';
    }

    setTimeout(function() {
      formSubmit();
    }, 50);
  };

  //RYM
  var consultantFocus = function(type, event) {
    var vavoomEl = document.getElementById('vavoom-' + type);
    var consultantsObj, consultants, y, l;

    //console.log('FUNCTION: consultantFocus()')

    consultantsObj = store.get(type);
    //console.log('X (4):', type, consultantsObj);

    if (!consultantsObj) { return; }

    if (vavoomEl) {
      vavoomEl.style.display = 'block';
      return;
    }

    consultants = Object.keys(consultantsObj);

    ////console.log('vavoomEl', consultants);

    y = event.target.offsetTop;
    l = document.createElement('ol');

    l.id = 'vavoom-' + type;
    //l.setAttribute('id', 'vavoom-consultant');
    l.setAttribute('class', 'vavoom');
    l.style.top = y + 'px';
    l.style.display = 'block';
    ////console.log('L:', l);
    consultants.forEach(function(c) {
      var i = document.createElement('li');
      var a = document.createElement('a');
      ////console.log('C', c);
      a.innerHTML = c;
      a.href = '#';
      a.addEventListener('click', pickConsultant.bind(null, type));
      i.appendChild(a);
      l.appendChild(i);
    });
    formEl.appendChild(l);
  };

  var uploadImage = function(event) {
    var file = event.target.files[0];
    var options = {};
    var name;

    if (!file.type.match(/^image\//)) { throw new Error(''); }

    if (event.target.name === 'consultantLogo') { name = 'consultantBlackBG'; }
    else if (event.target.name === 'clientLogo') { name = 'clientBlackBG'; }
    if (name && document.getElementsByName(name)[0].checked) { options.bg = 'black'; }
    getBase64FromImage(URL.createObjectURL(file), options, function (img) {
      if (event.target.name === 'consultantLogo') {
        event.target.setAttribute('data-img', img);
        //consultantLogoEl.setAttribute('data-img', img);
      } else if (event.target.name === 'clientLogo') {
        //clientLogoEl.setAttribute('data-img', img);
      }
      //event.target.files[0].setAttribute('data-img', img);
      //event.target.files[0].value = img;
    });
  };

  window.store = store;
  factureDateEl.value = dateFrench();
  formEl.addEventListener('submit', formSubmit.bind(null, false));

  consultantEl.addEventListener('blur', consultantBlur.bind(null, 'consultant'));
  consultantEl.addEventListener('focus', consultantFocus.bind(null, 'consultant'));
  //consultantEl.addEventListener('click', consultantFocus.bind(null, 'consultant'));


  clientEl.addEventListener('blur', consultantBlur.bind(null, 'client'));
  clientEl.addEventListener('focus', consultantFocus.bind(null, 'client'));
  //clientEl.addEventListener('click', consultantFocus.bind(null, 'client'));
//  var clientLongEl = document.getElementsByName('clientLong')[0];


  addItemEl.addEventListener('click', addItemForm);
  for (r = 0; r < downloadEls.length; ++r) {
    downloadEls[r].addEventListener('click', formSubmit.bind(null, downloadEls[r].value));
  }

  for (r = 0; r < imageEls.length; ++r) {
    imageEls[r].addEventListener('change', uploadImage);
  }
  addItemForm(true);
  formSubmit();
}());
