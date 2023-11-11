const App = {
   oninit() {
      this.atoms = [];
      this.groups = [];
      this.gMaps = [];
      this.radius = 3;
      this.minRandomG = -10;
      this.maxRandomG = 5;
      this.maxDistance = 160;
      this.alpha = 0.8;
      this.trail = 0.8;
      this.PI_2 = Math.PI * 2;
      this.groupA = null;
      this.groupB = null;

      for (let k in this) {
         if (typeof this[k] == "function") {
            this[k] = this[k].bind(this);
         }
      }
   },

   oncreate() {
      this.canvas = document.createElement("canvas");
      this.viewerVnode.dom.appendChild(this.canvas);
      this.updateSize();

      // Số lượng mỗi hạt mỗi nhóm mặc định là 200:
      this.addGroup(200, "#e11d48");
      this.addGroup(200, "#d97706");
      this.addGroup(200, "#16a34a");
      this.addGroup(200, "#2563eb");
      this.addGroup(200, "#475569");
      this.addGroup(200, "#7c3aed");
      this.addGroup(200, "#0891b2");
      this.addGroup(200, "#c026d3");
      this.addGroup(200, "#e2e8f0");
      this.render();
      window.addEventListener("resize", this.updateSize);
      m.redraw();
   },

   render() {
      var i$, ref$, len$, group, j$, ref1$, len1$, group2, atom;
      for (i$ = 0, len$ = (ref$ = this.groups).length; i$ < len$; ++i$) {
         group = ref$[i$];
         for (j$ = 0, len1$ = (ref1$ = this.groups).length; j$ < len1$; ++j$) {
            group2 = ref1$[j$];
            this.rule(group.atoms, group2.atoms, this.gMaps[group.color][group2.color]);
         }
      }
      // this.g.clearRect(0, 0, this.width, this.height);
      this.g.fillStyle = `rgba(0, 0, 0, ${this.trail})`;
      this.g.fillRect(0, 0, this.width, this.height);
      this.g.globalAlpha = this.alpha;
      for (i$ = 0, len$ = (ref$ = this.atoms).length; i$ < len$; ++i$) {
         atom = ref$[i$];
         this.g.beginPath();
         this.g.fillStyle = atom.color;
         this.g.arc(atom.x, atom.y, this.radius, 0, this.PI_2);
         this.g.fill();
         this.g.closePath();
      }
      this.g.globalAlpha = 1;
      requestAnimationFrame(this.render);
   },

   updateSize() {
      this.width = this.viewerVnode.dom.offsetWidth;
      this.height = this.viewerVnode.dom.offsetHeight;
      this.halfWidth = this.width / 2;
      this.halfHeight = this.height / 2;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.g = this.canvas.getContext("2d");
   },

   addAtom(x, y, color) {
      const group = this.groups.find(v => v.color === color);
      const atom = {
         x, y, color,
         vx: 0,
         vy: 0
      };
      group.atoms.push(atom);
   },

   addGroup(num, color) {
      const group = {
         color: color,
         atoms: []
      };
      for (let i = 0; i < num; ++i) {
         atom = {
            x: this.random(this.width * 0.25, this.width * 0.75),
            y: this.random(this.height * 0.25, this.height * 0.75),
            vx: 0,
            vy: 0,
            color: color
         };
         group.atoms.push(atom);
         this.atoms.push(atom);
      }
      this.gMaps[color] = {};
      this.groups.push(group);
      for (const groupA of this.groups) {
         for (const groupB of this.groups) {
            this.gMaps[groupA.color][groupB.color] ??= 0;
         }
      }
      m.redraw();
   },

   rule(atoms, atoms2, g) {
      var i$, len$, atom, fx, fy, j$, len1$, atom2, dx, dy, d, f;
      for (i$ = 0, len$ = atoms.length; i$ < len$; ++i$) {
         atom = atoms[i$];
         fx = 0;
         fy = 0;
         for (j$ = 0, len1$ = atoms2.length; j$ < len1$; ++j$) {
            atom2 = atoms2[j$];
            if (atom === atom2) {
               continue;
            }
            dx = atom.x - atom2.x;
            dy = atom.y - atom2.y;
            d = Math.sqrt(dx * dx + dy * dy);

            if (d > 0 && d < this.maxDistance) {
               f = g * 1 / d;
               fx += f * dx;
               fy += f * dy;
            }
         }
         atom.vx = (atom.vx + fx) * 0.5;
         atom.vy = (atom.vy + fy) * 0.5;
         atom.x += atom.vx;
         atom.y += atom.vy;
         if (atom.x < this.radius || atom.x >= this.width - this.radius) {
            atom.x = this.halfWidth;
         }
         if (atom.y < this.radius || atom.y >= this.height - this.radius) {
            atom.y = this.halfHeight;
         }
      }
   },

   random(min, max) {
      max = [1, min, max][arguments.length];
      min = [0, 0, min][arguments.length];
      return min + Math.floor(Math.random() * (max - min + 1));
   },

   getBgColorByG(g) {
      if (g > 0) {
         return "rgba(0, 128, 0, " + g + ")";
      } else if (g < 0) {
         return "rgba(255, 0, 0, " + (-g) + ")";
      } else {
         return "#0000";
      }
   },

   getTextColorByG(g) {
      if (g > 0) {
         return "#84cc16";
      } else if (g < 0) {
         return "#fb7185";
      } else {
         return "#fff";
      }
   },

   onmouseenterG(g, groupA, groupB, event) {
      this.groupA = groupA;
      this.groupB = groupB;
   },

   onmouseleaveG(g, groupA, groupB, event) {
      this.groupA = null;
      this.groupB = null;
   },

   onclickG(g, groupA, groupB, event) {
      let amount = event.shiftKey ? 1 : 0.1;
      this.gMaps[groupA.color][groupB.color] = Math.round((g + amount) * 10) / 10;
   },

   onauxclickG(g, groupA, groupB, event) {
      if (event.button = 1) {
         this.gMaps[groupA.color][groupB.color] = 0;
      }
   },

   oncontextmenuG(g, groupA, groupB, event) {
      let amount = event.shiftKey ? 1 : 0.1;
      this.gMaps[groupA.color][groupB.color] = Math.round((g - amount) * 10) / 10;
   },

   onclickRandomG() {
      for (const k in this.gMaps) {
         const val = this.gMaps[k];
         for (const k2 in val) {
            val[k2] = this.random(this.minRandomG, this.maxRandomG) / 10;
         }
      }
   },

   onclickResetG() {
      for (const k in this.gMaps) {
         const val = this.gMaps[k];
         for (const k2 in val) {
            val[k2] = 0;
         }
      }
   },

   view() {
      return m(".flex.h-full",
         m(".flex-0.p-3.w-72.bg-slate-900",
            m("p", "Lực tương tác:"),
            m("table.w-full.table-fixed.text-center",
               m("tr.h-7",
                  m("th", "AB"),
                  this.groups.map((group => {
                     return m("th", {
                        style: {
                           background: group.color
                        }
                     });
                  })),
               ),
               this.groups.map((groupA => {
                  return m("tr.h-7",
                     m("th.justify-center.items-center.text-xs.font-normal.text-white/70", {
                        style: {
                           background: groupA.color
                        }
                     }, groupA.atoms.length),
                     this.groups.map((groupB => {
                        var g;
                        g = this.gMaps[groupB.color][groupA.color];
                        return m("td.justify-center.items-center.text-xs.text-white/70", {
                           style: {
                              background: this.getBgColorByG(g)
                           },
                           onmouseenter: this.onmouseenterG.bind(this, g, groupA, groupB),
                           onmouseleave: this.onmouseleaveG.bind(this, g, groupA, groupB),
                           onclick: this.onclickG.bind(this, g, groupB, groupA),
                           onauxclick: this.onauxclickG.bind(this, 0, groupB, groupA),
                           oncontextmenu: this.oncontextmenuG.bind(this, g, groupB, groupA)
                        },
                           Math.round(g * 10)
                        );
                     }))
                  );
               }))
            ),
            m(".mt-2.h-6",
               this.groupA && (
                  m(".flex.items-center.gap-4",
                     m(".flex.items-center",
                        m(".w-6.h-6.border", {
                           style: {
                              background: this.groupA.color
                           }
                        }),
                        m(".w-6.h-6.border.border-l-0", {
                           style: {
                              background: this.groupB.color
                           }
                        }),
                        m(".ml-2.w-6.h-6.flex.justify-center.items-center.text-xs", {
                           style: {
                              background: this.getBgColorByG(this.gMaps[this.groupB.color][this.groupA.color])
                           }
                        },
                           Math.round(this.gMaps[this.groupB.color][this.groupA.color] * 10)
                        ),
                     ),
                     m(".flex.items-center",
                        m(".w-6.h-6.border", {
                           style: {
                              background: this.groupB.color
                           }
                        }),
                        m(".w-6.h-6.border.border-l-0", {
                           style: {
                              background: this.groupA.color
                           }
                        }),
                        m(".ml-2.w-6.h-6.flex.justify-center.items-center.text-xs", {
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
            m(".mt-2", "Khoảng ngẫu nhiên khi tạo lực:"),
            m(".flex.gap-2",
               m("input.flex-1.min-w-0.px-2.rounded.text-black", {
                  type: "number",
                  max: this.maxRandomG,
                  value: this.minRandomG,
                  title: "Tối thiểu",
                  oninput: (event) => {
                     this.minRandomG = event.target.valueAsNumber;
                  }
               }),
               m("input.flex-1.min-w-0.px-2.rounded.text-black", {
                  type: "number",
                  min: this.minRandomG,
                  value: this.maxRandomG,
                  title: "Tối đa",
                  oninput: (event) => {
                     this.maxRandomG = event.target.valueAsNumber;
                  }
               })
            ),
            m(".text-xs.text-slate-500", "Có thể cuộn chuột trên ô input để tăng/giảm luôn, không cần tập trung vào ô input"),
            m(".text-center.mt-2",
               m("button.px-2.border.border-slate-400.hover:border-slate-300.rounded.bg-slate-600", {
                  onclick: this.onclickRandomG
               }, "Ngẫu nhiên lực"),
               m("button.px-2.border.border-slate-400.hover:border-slate-300.rounded.bg-slate-600.ml-2", {
                  onclick: this.onclickResetG
               }, "Reset lực")
            ),
            m(".mt-2", "Khoảng cách các hạt tương tác:"),
            m("input.flex-1.min-w-0.w-full.px-2.rounded.text-black", {
               type: "number",
               min: 0,
               step: 10,
               value: this.maxDistance,
               oninput: (event) => {
                  let value = Number(event.target.value);
                  if (isNaN(value)) return;
                  this.maxDistance = value;
               }
            }),
            m(".mt-2", "Bán kính hạt:"),
            m("input.flex-1.min-w-0.w-full.px-2.rounded.text-black", {
               type: "number",
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
            m(".mt-2", "Độ trong suốt hạt:"),
            m("input.flex-1.min-w-0.w-full.px-2.rounded.text-black", {
               type: "number",
               min: 0.05,
               max: 1,
               step: 0.05,
               value: this.alpha,
               oninput: (event) => {
                  let value = Number(event.target.value);
                  if (isNaN(value)) return;
                  this.alpha = value;
               }
            }),
            m(".mt-2", "Hiệu ứng vệt mờ:"),
            m("input.flex-1.min-w-0.w-full.px-2.rounded.text-black", {
               type: "number",
               min: 0,
               max: 1,
               step: 0.05,
               value: this.trail,
               oninput: (event) => {
                  let value = Number(event.target.value);
                  if (isNaN(value)) return;
                  this.trail = value;
               }
            }),
            m("p.mt-2", "Hướng dẫn:"),
            m("p.text-sm.text-slate-400",
               m("div", "Chuột trái: Lực + 1"),
               m("div", "Chuột phải: Lực - 1"),
               m("div", "Chuột giữa: Lực = 0"),
               m("div", "Đè Shift để tăng/giảm 10 lần")
            ),
            m("p.text-sm.text-slate-400",
               m("div", "Cột dọc là A, cột ngang là B"),
               m("div", "Lực > 0, A đẩy B"),
               m("div", "Lực < 0, A hút B")
            )
         ),
         this.viewerVnode =
         m(".flex-1.h-full.overflow-hidden")
      );
   }
};

m.mount(document.body, App);

window.addEventListener("contextmenu", event => {
   event.preventDefault();
});

document.body.addEventListener("wheel", event => {
   if (event.target.localName == "input" && event.target.type == "number") {
      event.target.stepUp(event.deltaY < 0 ? 1 : -1);
      const evt = new InputEvent("input");
      event.target.dispatchEvent(evt);
   }
});
