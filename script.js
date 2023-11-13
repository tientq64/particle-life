class App {
   constructor() {
      this.width = screen.width;
      this.height = screen.height;
      this.groupA = null;
      this.groupB = null;
      this.isShowPanel = true;
      this.loaded = false;

      for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
         if (typeof this[k] == 'function') {
            this[k] = this[k].bind(this);
         }
      }
   }

   oncreate(vnode) {
      const offscreenCanvas = this.canvasVnode.dom.transferControlToOffscreen();
      this.worker = new Worker(new URL('worker.js', location.href));
      this.worker.addEventListener('message', this.onmessageWorker);
      this.send("init", {
         width: this.width,
         height: this.height,
         offscreenCanvas: offscreenCanvas
      }, [offscreenCanvas]);
      window.addEventListener('keydown', this.onkeydownGlobal);
      m.redraw();
   }

   send(name, data, transfers) {
      this.worker.postMessage([name, data], transfers);
   }

   sendProps(...names) {
      const props = {};
      for (const name of names) {
         props[name] = this[name];
      }
      this.worker.postMessage(['props', props]);
   }

   sendCall(name, ...args) {
      this.worker.postMessage(['call', {
         name: name,
         args: args
      }]);
   }

   getBgColorByG(g) {
      if (g > 0) {
         return `rgba(0, 128, 0, ${g})`;
      } else if (g < 0) {
         return `rgba(255, 0, 0, ${-g})`;
      } else {
         return '#0000';
      }
   }

   getTextColorByG(g) {
      if (g > 0) {
         return '#84cc16';
      } else if (g < 0) {
         return '#fb7185';
      } else {
         return '#fff';
      }
   }

   onmousedownGroupA(group, event) {
      let num = event.shiftKey ? 10 : 1;
      switch (event.button) {
         case 0:
            this.sendCall('addAtoms', group.color, num);
            break;
         case 2:
            this.sendCall('removeAtoms', group.color, num);
            break;
      }
   }

   onmouseenterG(groupA, groupB) {
      this.groupA = groupA;
      this.groupB = groupB;
   }

   onmouseleaveG() {
      this.groupA = null;
      this.groupB = null;
   }

   onmousedownG(groupA, groupB, event) {
      let amount = event.shiftKey ? 1 : 0.1;
      const gMapsA = this.gMaps[groupA.color];
      let g = gMapsA[groupB.color];
      switch (event.button) {
         case 0:
         case 2:
            if (event.button == 2) {
               amount *= -1;
            }
            this.gMaps[groupA.color][groupB.color] = Math.round((g + amount) * 10) / 10;
            this.sendProps('gMaps');
            break;
         case 1:
            this.gMaps[groupA.color][groupB.color] = 0;
            this.sendProps('gMaps');
            break;
      }
   }

   onmessageWorker(event) {
      const [name, data] = event.data;
      switch (name) {
         case 'loaded':
            Object.assign(this, data);
            this.loaded = true;
            break;

         case 'props':
            Object.assign(this, data);
            break;
      }
      m.redraw();
   }

   onkeydownGlobal(event) {
      const { ctrlKey: ctrl, shiftKey: shift, altKey: alt, repeat } = event;
      const codeRepeat = !ctrl && !shift && !alt;
      const codeOnce = codeRepeat && !repeat;

      if (event.code == 'Space' && codeOnce) {
         if (event.target.matches('button, input[type=number]')) {
            event.preventDefault();
            event.target.blur();
         }
      }
      if (document.activeElement === document.body) {
         switch (event.code) {
            case 'Space':
               if (codeOnce) {
                  this.isShowPanel = !this.isShowPanel;
               }
               break;

            case 'KeyR':
               if (codeOnce) {
                  this.sendCall('randomGMaps');
               }
               break;
         }
         m.redraw();
      }
   }

   view() {
      return (
         m('.h-full',
            this.loaded && (
               m('.absolute.p-3.w-72.h-full.bg-black.bg-opacity-50', {
                  hidden: !this.isShowPanel
               },
                  m('p', 'Lực tương tác:'),
                  m('table.w-full.table-fixed.text-center',
                     m('tr.h-7',
                        m('th.font-normal', 'AB'),
                        this.groups.map(group =>
                           m('th', {
                              style: {
                                 background: group.color
                              }
                           })
                        ),
                     ),
                     this.groups.map(groupA =>
                        m('tr.h-7',
                           m('th.justify-center.items-center.text-xs.font-normal.text-white', {
                              style: {
                                 background: groupA.color
                              },
                              onmousedown: this.onmousedownGroupA.bind(this, groupA)
                           }, groupA.atomsNum),
                           this.groups.map(groupB => {
                              const g = this.gMaps[groupA.color][groupB.color];
                              return m('td.justify-center.items-center.text-xs.text-white', {
                                 style: {
                                    background: this.getBgColorByG(g)
                                 },
                                 onmouseenter: this.onmouseenterG.bind(this, groupA, groupB),
                                 onmouseleave: this.onmouseleaveG,
                                 onmousedown: this.onmousedownG.bind(this, groupA, groupB)
                              },
                                 Math.round(g * 10)
                              );
                           })
                        )
                     )
                  ),

                  m('.mt-2.h-6',
                     this.groupA && (
                        m('.flex.items-center.gap-4',
                           m('.flex.items-center',
                              m('.w-6.h-6.border', {
                                 style: {
                                    background: this.groupA.color
                                 }
                              }),
                              m('.w-6.h-6.border.border-l-0', {
                                 style: {
                                    background: this.groupB.color
                                 }
                              }),
                              m('.ml-2.w-6.h-6.flex.justify-center.items-center.text-xs', {
                                 style: {
                                    background: this.getBgColorByG(this.gMaps[this.groupA.color][this.groupB.color])
                                 }
                              },
                                 Math.round(this.gMaps[this.groupA.color][this.groupB.color] * 10)
                              ),
                           ),
                           m('.flex.items-center',
                              m('.w-6.h-6.border', {
                                 style: {
                                    background: this.groupB.color
                                 }
                              }),
                              m('.w-6.h-6.border.border-l-0', {
                                 style: {
                                    background: this.groupA.color
                                 }
                              }),
                              m('.ml-2.w-6.h-6.flex.justify-center.items-center.text-xs', {
                                 style: {
                                    background: this.getBgColorByG(this.gMaps[this.groupB.color][this.groupA.color])
                                 }
                              },
                                 Math.round(this.gMaps[this.groupB.color][this.groupA.color] * 10)
                              )
                           )
                        )
                     )
                  ),
                  m('p.text-sm.text-gray-400',
                     m('div', 'Chuột trái: Lực + 1'),
                     m('div', 'Chuột phải: Lực - 1'),
                     m('div', 'Chuột giữa: Lực = 0'),
                     m('div', 'Đè Shift để tăng/giảm 10 lần'),
                     m('div', 'Lực < 0, A hút vào B'),
                     m('div', 'Lực > 0, A đẩy khỏi B')
                  ),

                  m('.mt-2', 'Khoảng ngẫu nhiên khi tạo lực:'),
                  m('.flex.gap-2',
                     m('input.flex-1.min-w-0.px-2.rounded.text-black', {
                        type: 'number',
                        max: this.maxRandomG,
                        value: this.minRandomG,
                        title: 'Min',
                        oninput: (event) => {
                           let value = Number(event.target.value);
                           if (isNaN(value)) return;
                           this.minRandomG = value;
                           this.sendProps('minRandomG');
                        }
                     }),

                     m('input.flex-1.min-w-0.px-2.rounded.text-black', {
                        type: 'number',
                        min: this.minRandomG,
                        value: this.maxRandomG,
                        title: 'Max',
                        oninput: (event) => {
                           let value = Number(event.target.value);
                           if (isNaN(value)) return;
                           this.maxRandomG = value;
                           this.sendProps('maxRandomG');
                        }
                     })
                  ),

                  m('.mt-2.text-center',
                     m('button.px-2.border.border-gray-400.hover:border-gray-300.rounded.bg-gray-600', {
                        onclick: () => {
                           this.sendCall('randomGMaps');
                        }
                     }, 'Ngẫu nhiên lực'),
                     m('button.px-2.border.border-gray-400.hover:border-gray-300.rounded.bg-gray-600.ml-2', {
                        onclick: () => {
                           this.sendCall('resetGMaps');
                        }
                     }, 'Reset lực')
                  ),

                  m('.mt-2', 'Khoảng cách các hạt tương tác:'),
                  m('.flex.gap-2',
                     m('input.flex-1.min-w-0.px-2.rounded.text-black', {
                        type: 'number',
                        min: 0,
                        max: this.maxDistance,
                        value: this.minDistance,
                        title: 'Min',
                        oninput: (event) => {
                           let value = Number(event.target.value);
                           if (isNaN(value)) return;
                           this.minDistance = value;
                           this.sendProps('minDistance');
                        }
                     }),

                     m('input.flex-1.min-w-0.px-2.rounded.text-black', {
                        type: 'number',
                        min: this.minDistance,
                        max: 1000,
                        value: this.maxDistance,
                        title: 'Max',
                        oninput: (event) => {
                           let value = Number(event.target.value);
                           if (isNaN(value)) return;
                           this.maxDistance = value;
                           this.sendProps('maxDistance');
                        }
                     })
                  ),

                  m('.mt-2', 'Bán kính hạt:'),
                  m('input.flex-1.min-w-0.w-full.px-2.rounded.text-black', {
                     type: 'number',
                     min: 0.5,
                     max: 500,
                     step: 0.5,
                     value: this.radius,
                     oninput: (event) => {
                        let value = Number(event.target.value);
                        if (isNaN(value)) return;
                        this.radius = value;
                        this.sendProps('radius');
                     }
                  }),

                  m('.mt-2', 'Độ trong suốt hạt:'),
                  m('input.flex-1.min-w-0.w-full.px-2.rounded.text-black', {
                     type: 'number',
                     min: 0.1,
                     max: 1,
                     step: 0.1,
                     value: this.alpha,
                     oninput: (event) => {
                        let value = Number(event.target.value);
                        if (isNaN(value)) return;
                        this.alpha = value;
                        this.sendProps('alpha');
                     }
                  }),

                  m('.mt-2', 'Hiệu ứng vệt mờ:'),
                  m('input.flex-1.min-w-0.w-full.px-2.rounded.text-black', {
                     type: 'number',
                     min: 0,
                     max: 1,
                     step: 0.1,
                     value: this.trail,
                     oninput: (event) => {
                        let value = Number(event.target.value);
                        if (isNaN(value)) return;
                        this.trail = value;
                        this.sendProps('trail');
                     }
                  }),

                  m('p.mt-2', 'Phím tắt:'),
                  m('p.text-sm.text-gray-400',
                     m('div', 'Nhấn R để ngẫu nhiên lực.'),
                     m('div', 'Nhấn Space để bật/tắt bảng điều khiển này.')
                  ),

                  m('p.mt-2', 'Mẹo:'),
                  m('p.text-sm.text-gray-400',
                     m('div', 'Có thể cuộn chuột khi bấm vào ô input để tăng/giảm.'),
                     m('div', 'Mở toàn màn hình để xem toàn bộ bản đồ.')
                  )
               )
            ),
            this.canvasVnode =
            m('canvas', {
               width: this.width,
               height: this.height
            })
         )
      );
   }
}

m.mount(document.body, App);

window.addEventListener('contextmenu', event => {
   event.preventDefault();
});

document.body.addEventListener('wheel', () => {
});
