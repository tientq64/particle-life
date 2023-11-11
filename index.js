const App = {
   oninit() {
      this.atoms = [];
      this.groups = [];
      this.gMaps = [];
      this.radius = 3;
      this.minRandomG = -10;
      this.maxRandomG = 8;
      this.minDistance = 0;
      this.maxDistance = 160;
      this.alpha = 0.8;
      this.trail = 0.5;
      this.PI_2 = Math.PI * 2;
      this.groupA = null;
      this.groupB = null;
      this.isShowPanel = true;

      for (const k in this) {
         if (typeof this[k] == 'function') {
            this[k] = this[k].bind(this);
         }
      }
   },

   oncreate() {
      this.canvas = document.createElement('canvas');
      this.viewerVnode.dom.appendChild(this.canvas);
      this.updateSize();
      setTimeout(this.updateSize, 100);

      this.addGroup('#e11d48', 100);
      this.addGroup('#d97706', 100);
      this.addGroup('#16a34a', 100);
      this.addGroup('#2563eb', 100);
      this.addGroup('#475569', 100);
      this.addGroup('#7c3aed', 100);
      this.addGroup('#0891b2', 100);
      this.addGroup('#c026d3', 100);
      this.addGroup('#e2e8f0', 100);
      this.render();
      window.addEventListener('resize', this.updateSize);
      window.addEventListener('keydown', this.onkeydownGlobal);
      m.redraw();
   },

   random(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
   },

   addAtom(group, x, y) {
      const newAtom = {
         x, y,
         color: group.color,
         vx: 0,
         vy: 0
      };
      group.atoms.push(newAtom);
      this.atoms.push(newAtom);
   },

   removeAtom(group) {
      const atom = group.atoms.pop();
      if (atom) {
         const index = this.atoms.indexOf(atom);
         this.atoms.splice(index, 1);
      }
   },

   addGroup(color, num) {
      const newGroup = {
         color: color,
         atoms: []
      };
      for (let i = 0; i < num; ++i) {
         this.addAtom(
            newGroup,
            this.random(this.width * 0.25, this.width * 0.75),
            this.random(this.height * 0.25, this.height * 0.75)
         );
      }
      this.gMaps[color] = {};
      this.groups.push(newGroup);
      for (const groupA of this.groups) {
         for (const groupB of this.groups) {
            this.gMaps[groupA.color][groupB.color] ??= 0;
         }
      }
   },

   updateSize() {
      this.width = this.viewerVnode.dom.offsetWidth;
      this.height = this.viewerVnode.dom.offsetHeight;
      this.halfWidth = this.width / 2;
      this.halfHeight = this.height / 2;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.g = this.canvas.getContext('2d');
   },

   rule(groupA, groupB) {
      let g = this.gMaps[groupA.color][groupB.color];
      for (let i = 0; i < groupA.atoms.length; ++i) {
         const atomA = groupA.atoms[i];
         let fx = 0;
         let fy = 0;
         for (let j = 0; j < groupB.atoms.length; ++j) {
            const atomB = groupB.atoms[j];
            if (atomA === atomB) continue;
            let dx = atomA.x - atomB.x;
            let dy = atomA.y - atomB.y;
            let dxa = Math.abs(dx);
            let dya = Math.abs(dy);
            let dx2 = this.width - dxa;
            let dy2 = this.height - dya;
            if (dx2 < dxa) {
               dx = dx2 * (dx > 0 ? -1 : 1);
            }
            if (dy2 < dya) {
               dy = dy2 * (dy > 0 ? -1 : 1);
            }
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d >= this.minDistance && d <= this.maxDistance) {
               let f = g * 1 / d;
               fx += f * dx;
               fy += f * dy;
            }
         }
         atomA.vx = (atomA.vx + fx) * 0.5;
         atomA.vy = (atomA.vy + fy) * 0.5;
         atomA.x += atomA.vx;
         atomA.y += atomA.vy;
         if (atomA.x < 0) {
            atomA.x += this.width;
         } else if (atomA.x >= this.width) {
            atomA.x -= this.width;
         }
         if (atomA.y < 0) {
            atomA.y += this.height;
         } else if (atomA.y >= this.height) {
            atomA.y -= this.height;
         }
      }
   },

   render() {
      for (let i = 0; i < this.groups.length; ++i) {
         const groupA = this.groups[i];
         for (let j = 0; j < this.groups.length; ++j) {
            const groupB = this.groups[j];
            this.rule(groupA, groupB);
         }
      }
      this.g.globalAlpha = this.trail;
      this.g.fillStyle = '#000';
      this.g.fillRect(0, 0, this.width, this.height);
      this.g.globalAlpha = this.alpha;
      for (let i = 0; i < this.atoms.length; ++i) {
         const atom = this.atoms[i];
         this.g.beginPath();
         this.g.fillStyle = atom.color;
         this.g.arc(atom.x, atom.y, this.radius, 0, this.PI_2);
         this.g.fill();
         this.g.closePath();
      }
      requestAnimationFrame(this.render);
   },

   getBgColorByG(g) {
      if (g > 0) {
         return `rgba(0, 128, 0, ${g})`;
      } else if (g < 0) {
         return `rgba(255, 0, 0, ${-g})`;
      } else {
         return '#0000';
      }
   },

   getTextColorByG(g) {
      if (g > 0) {
         return '#84cc16';
      } else if (g < 0) {
         return '#fb7185';
      } else {
         return '#fff';
      }
   },

   onmousedownGroupA(group, event) {
      let num = event.shiftKey ? 10 : 1;
      for (let i = 0; i < num; i++) {
         switch (event.button) {
            case 0:
               this.addAtom(
                  group,
                  this.random(this.width * 0.25, this.width * 0.75),
                  this.random(this.height * 0.25, this.height * 0.75)
               );
               break;
            case 2:
               this.removeAtom(group);
               break;
         }
      }
   },

   onmouseenterG(groupA, groupB) {
      this.groupA = groupA;
      this.groupB = groupB;
   },

   onmouseleaveG() {
      this.groupA = null;
      this.groupB = null;
   },

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
            gMapsA[groupB.color] = Math.round((g + amount) * 10) / 10;
            break;

         case 1:
            gMapsA[groupB.color] = 0;
            break;
      }
   },

   randomGMaps() {
      for (const k in this.gMaps) {
         const val = this.gMaps[k];
         for (const k2 in val) {
            val[k2] = this.random(this.minRandomG, this.maxRandomG) / 10;
         }
      }
   },

   resetGMaps() {
      for (const k in this.gMaps) {
         const val = this.gMaps[k];
         for (const k2 in val) {
            val[k2] = 0;
         }
      }
   },

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
                  setTimeout(this.updateSize, 100);
               }
               break;

            case 'KeyR':
               if (codeOnce) {
                  this.randomGMaps();
               }
               break;
         }
         m.redraw();
      }
   },

   view() {
      return m('.flex.h-full',
         m('.flex-0.p-3.w-72.h-full.bg-black.bg-opacity-50.absolute', {
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
                     }, groupA.atoms.length),
                     this.groups.map(groupB => {
                        var g;
                        g = this.gMaps[groupB.color][groupA.color];
                        return m('td.justify-center.items-center.text-xs.text-white', {
                           style: {
                              background: this.getBgColorByG(g)
                           },
                           onmouseenter: this.onmouseenterG.bind(this, groupA, groupB),
                           onmouseleave: this.onmouseleaveG,
                           onmousedown: this.onmousedownG.bind(this, groupB, groupA)
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
                              background: this.getBgColorByG(this.gMaps[this.groupB.color][this.groupA.color])
                           }
                        },
                           Math.round(this.gMaps[this.groupB.color][this.groupA.color] * 10)
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
                              background: this.getBgColorByG(this.gMaps[this.groupA.color][this.groupB.color])
                           }
                        },
                           Math.round(this.gMaps[this.groupA.color][this.groupB.color] * 10)
                        )
                     )
                  )
               )
            ),

            m('.mt-2', 'Khoảng ngẫu nhiên khi tạo lực:'),
            m('.flex.gap-2',
               m('input.flex-1.min-w-0.px-2.rounded.text-black', {
                  type: 'number',
                  max: this.maxRandomG,
                  value: this.minRandomG,
                  title: 'Min',
                  oninput: (event) => {
                     this.minRandomG = event.target.valueAsNumber;
                  }
               }),

               m('input.flex-1.min-w-0.px-2.rounded.text-black', {
                  type: 'number',
                  min: this.minRandomG,
                  value: this.maxRandomG,
                  title: 'Max',
                  oninput: (event) => {
                     this.maxRandomG = event.target.valueAsNumber;
                  }
               })
            ),

            m('.mt-2.text-center',
               m('button.px-2.border.border-gray-400.hover:border-gray-300.rounded.bg-gray-600', {
                  onclick: this.randomGMaps
               }, 'Ngẫu nhiên lực'),
               m('button.px-2.border.border-gray-400.hover:border-gray-300.rounded.bg-gray-600.ml-2', {
                  onclick: this.resetGMaps
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
               }
            }),

            m('p.mt-2', 'Hướng dẫn:'),
            m('p.text-sm.text-gray-400',
               m('div', 'Chuột trái: Lực + 1'),
               m('div', 'Chuột phải: Lực - 1'),
               m('div', 'Chuột giữa: Lực = 0'),
               m('div', 'Đè Shift để tăng/giảm 10 lần')
            ),
            m('p.text-sm.text-gray-400',
               m('div', 'Cột dọc là A, cột ngang là B'),
               m('div', 'Lực > 0, A đẩy B'),
               m('div', 'Lực < 0, A hút B')
            ),
            m('p.text-sm.text-gray-400',
               'Có thể cuột chuột khi bấm vào ô input để tăng/giảm.'
            )
         ),

         this.viewerVnode =
         m('.flex-1.h-full.overflow-hidden')
      );
   }
};

m.mount(document.body, App);

window.addEventListener('contextmenu', event => {
   event.preventDefault();
});

document.body.addEventListener('wheel', event => {
});
