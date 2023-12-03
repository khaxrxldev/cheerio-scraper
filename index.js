const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const PORT = 5000;

async function first() {
  const URLs = [
    "https://maghfirahtravel.com.my/pakej-umrah/umrah-fairmont-lite/",
    "https://maghfirahtravel.com.my/pakej-umrah/umrah-rahmah-ekonomi/",
    "https://maghfirahtravel.com.my/pakej-umrah/umrah-klasik-swissotel/"
  ];

  let umrahPackages = [];

  for (const URL of URLs) {
    let roomData = [];
    await axios(URL).then((response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      let packageName = $('div.elementor-element.elementor-element-33c8746.elementor-widget.elementor-widget-heading > div.elementor-widget-container > h2.elementor-heading-title.elementor-size-default').text();
      let makkahHotel = $('div.elementor-element.elementor-element-980c466.elementor-widget__width-auto.elementor-widget.elementor-widget-jet-listing-dynamic-field > div.elementor-widget-container > div.jet-listing.jet-listing-dynamic-field.display-inline > div.jet-listing-dynamic-field__inline-wrap > div.jet-listing-dynamic-field__content').text();
      let madinahHotel = $('div.elementor-element.elementor-element-446ad57.elementor-widget__width-auto.elementor-widget.elementor-widget-jet-listing-dynamic-field > div.elementor-widget-container > div.jet-listing.jet-listing-dynamic-field.display-inline > div.jet-listing-dynamic-field__inline-wrap > div.jet-listing-dynamic-field__content').text();
      let duration = $('div.elementor-element.elementor-element-6ce4bdf.elementor-widget__width-auto.elementor-widget.elementor-widget-jet-listing-dynamic-field > div.elementor-widget-container > div.jet-listing.jet-listing-dynamic-field.display-inline > div.jet-listing-dynamic-field__inline-wrap > div.jet-listing-dynamic-field__content').text();
      
      let seasons = $('section[data-id=e6d02d8] > div.elementor-container.elementor-column-gap-no > div.elementor-column.elementor-col-50.elementor-inner-column.elementor-element.elementor-element');
      
      let packageSeasons = [];
      $(seasons).each((index, element) => {
        let seasonName = $(element).find('div.elementor-widget-wrap.elementor-element-populated > div.elementor-element.elementor-widget__width-inherit.elementor-widget.elementor-widget-heading > div.elementor-widget-container > h2').text();
        packageSeasons.push(titleCase(seasonName.replace('Harga ', '')));

        let seasonRoomName = $(element).find('div.elementor-widget-wrap.elementor-element-populated > div.elementor-element.elementor-widget.elementor-widget-jet-dynamic-table > div.elementor-widget-container > div.jet-dynamic-table-wrapper > table > tbody > tr > td');
        
        $(seasonRoomName).each((indexRoom, elementRoom) => {
          roomData.push($(elementRoom).text());
        });
      });
      
      let rooms = [];
      for (let index = 0; index < roomData.length; index++) {
        if (index % 2 !== 0) {
          let room = {};
          room['room_name'] = roomData[index - 1];
          room['room_price'] = roomData[index];
          rooms.push(room);
        }
      }

      let packageRooms = [];
      let separator = [];
      for (let index = 0; index < rooms.length; index++) {
        separator.push(rooms[index])
        if ((index + 1) % 3 === 0) {
          packageRooms.push(separator)
          separator = [];
        }
      }
      
      let packages = [];
      for (let index = 0; index < packageSeasons.length; index++) {
        let package = {
          "name": packageSeasons[index],
          "rooms": packageRooms[index]
        }

        packages.push(package);
      }

      let umrahPackage = {
        "name": packageName,
        "url": URL,
        "makkahHotel": "Hotel " + makkahHotel,
        "madinahHotel": "Hotel " + madinahHotel,
        "duration": duration,
        "seasons": packages
      }

      umrahPackages.push(umrahPackage);
    });
  }
  
  return umrahPackages;
}

async function second() {
  const URLs = [
    "https://azzuhatravel.com/umrah-safwah/",
    "https://azzuhatravel.com/umrah-rotana/",
    "https://azzuhatravel.com/umrah-menara-makkah/"
  ];

  let umrahPackages = [];

  for (const URL of URLs) {
    let h3Texts = [];
    await axios(URL).then((response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);

      let packageNameContainer = $('div.elementor-row');

      let packageName = '';
      $(packageNameContainer[4]).find('h4').each((indexRoom, elementRoom) => {
        packageName = packageName + $(elementRoom).text() + " ";
      });

      let umrahPackage = {
        "name": packageName.trim(),
        "url": URL,
        "makkahHotel": "",
        "madinahHotel": "",
        "duration": ""
      }

      $('div.elementor-row').find('h3.elementor-heading-title.elementor-size-default').each((indexRoom, elementRoom) => {
        h3Texts.push($(elementRoom).text());
      });

      for (let index = 0; index < h3Texts.length; index++) {
        if (h3Texts[index] === 'Hotel Makkah') {
          umrahPackage['makkahHotel'] = 'HOTEL ' + h3Texts[index + 1];
        }
        if (h3Texts[index] === 'Hotel Madinah') {
          umrahPackage['madinahHotel'] = 'HOTEL ' + h3Texts[index + 1];
        }
      }

      $(packageNameContainer[6]).find('h4').each((indexRoom, elementRoom) => {
        if ($(elementRoom).text().includes('HARI') && $(elementRoom).text().includes('MALAM')) {
          umrahPackage['duration'] = $(elementRoom).text().match(/\d.*/)[0];
        }
      });

      let seasons = []
      $('table#tableSafwahLite:first > tbody > tr').each((indexSeason, elementSeason) => {
        let season = {
          "name": $(elementSeason).find("td:first").text()
        }

        seasons.push(season);
      });

      let tableDataList = [];
      $('table#tableSafwahLite:first').each((indexTable, elementTable) => {
        let addRoomStatus = false;
        
        $(elementTable).find("thead > tr > th").each((indexThead, elementThead) => {
          if (!$(elementThead).attr('rowspan')) {
            if (addRoomStatus) {
              let tableData = {
                'priceIndex': indexThead,
                'roomName': $(elementThead).text()
              }

              tableDataList.push(tableData);
            }
  
            if ($(elementThead).text() === 'JENIS BILIK') {
              addRoomStatus = true;
            }
          }
        });

        let seasons = [];
        $(elementTable).find("tbody > tr").each((indexTR, elementTR) => {
          let season = {};
          let rooms = [];

          $(elementTR).find("td").each((indexTD, elementTD) => {
            if (indexTD == 0) {
              season["name"] = $(elementTD).text();
            }
            if (!$(elementTD).attr('rowspan')) {
              for (const tableData of tableDataList) {
                if (indexTR == 0 && indexTD == (+tableData['priceIndex']) - 1) {
                  let room = {
                    "room_name": tableData['roomName'],
                    "room_price": $(elementTD).text()
                  }

                  rooms.push(room)
                }
                
                if (indexTR > 0 && indexTD == (+tableData['priceIndex']) - 2) {
                  let room = {
                    "room_name": tableData['roomName'],
                    "room_price": $(elementTD).text()
                  }

                  rooms.push(room)
                }
              }
            }
          });

          season["rooms"] = rooms;
          seasons.push(season);
          umrahPackage["seasons"] = seasons;
        });
      });
      
      umrahPackages.push(umrahPackage);
    });
  }
  
  return umrahPackages;
}

async function third() {
  let umrahPackages = [];
  let URL = 'https://feldatravel.com.my/pakej-umrah/';

  await axios(URL).then((response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    let seasonNameList = ['MB', 'CS'];

    $('div#pilihanpakej > div > div > div:eq(1) > div').each((indexPackageDiv, elementPackageDiv) => {
      let roomDataList = [];
      let umrahPackage = {
        'name':  '',
        'url': URL,
        'makkahHotel': '',
        'madinahHotel': '',
        'duration': '',
        'seasons': []
      };

      $(elementPackageDiv).find('span').each((indexSpan, elementSpan) => {
        if (indexSpan === 0) {
          umrahPackage['name'] = $(elementSpan).text().replace(/\n|\r/g, ' ');
          umrahPackages.push(umrahPackage);
        }
        
        if (indexSpan >= 1 && indexSpan <= 7 && indexSpan != 3) {
          roomDataList.push($(elementSpan).text())
        }

        if (indexSpan === 22) {
          umrahPackage['makkahHotel'] = $(elementSpan).text().replace('Makkah 5 Malam: ', '');
        }

        if (indexSpan === 25) {
          umrahPackage['madinahHotel'] = $(elementSpan).text().replace('Madinah 5 Malam: ', '');
        }

        if (indexSpan === 13) {
          umrahPackage['duration'] = $(elementSpan).text();
        }
      });

      let normalSeasonRooms = [];
      let schoolHolidayRooms = [];
      for (let index = 0; index < roomDataList.length; index++) {
        if (index % 2 !== 0) {
          normalSeasonRooms.push({
            'room_name': roomDataList[index - 1],
            'room_price': roomDataList[index].replace(',', '')
          });
          schoolHolidayRooms.push({
            'room_name': roomDataList[index - 1],
            'room_price': 'RM ' + (+(roomDataList[index].replace('RM ', '').replace(',', '')) + 1000).toString()
          });
        }
      }

      let seasons = []
      for (const seasonName of seasonNameList) {
        switch (seasonName) {
          case 'MB':
              seasons.push({
                'name': 'Musim Biasa',
                'rooms': normalSeasonRooms
              });
            break;
          case 'CS':
              seasons.push({
                'name': 'Cuti Sekolah',
                'rooms': schoolHolidayRooms
              });
            break;
        }
      }

      umrahPackage['seasons'] = seasons;
    });
  });

  return umrahPackages;
}

app.get("/umrah", async (req, res) => {
  try {
    const scrapeResult = await third();
      return res.status(200).json({
      result: scrapeResult,
    });
  } catch (err) {
    return res.status(500).json({
      err: err.toString(),
    });
  }
});

function titleCase(str) {
  let splitStr = str.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  
  return splitStr.join(' '); 
}

app.listen(PORT, () => console.log(`server running on port ${PORT}`));