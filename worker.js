class RenderWorker {
   constructor() {
      for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
         if (typeof this[k] == 'function') {
            this[k] = this[k].bind(this);
         }
      }

      this.PI_2 = Math.PI * 2;
      this.radius = 3;
      this.minRandomG = -10;
      this.maxRandomG = 8;
      this.minDistance = 0;
      this.maxDistance = 160;
      this.alpha = 0.8;
      this.trail = 0.5;
      this.gMaps = {};
      this.groups = [];
      this.groupsAtoms = {};
      self.addEventListener('message', this.onmessage);
   }

   random(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
   }

   addAtom(group, x, y) {
      const newAtom = {
         x, y,
         color: group.color,
         vx: 0,
         vy: 0
      };
      this.groupsAtoms[group.color].push(newAtom);
      group.atomsNum++;
   }

   addGroup(color, num) {
      const newGroup = {
         color: color,
         atomsNum: 0
      };
      this.groups.push(newGroup);
      const newGroupsAtoms = [];
      this.groupsAtoms[color] = newGroupsAtoms;
      for (let i = 0; i < num; ++i) {
         this.addAtom(
            newGroup,
            this.random(1, this.width - 1),
            this.random(1, this.height - 1)
         );
      }
      this.gMaps[color] = {};
      for (const groupA of this.groups) {
         for (const groupB of this.groups) {
            this.gMaps[groupA.color][groupB.color] ??= this.random(this.minRandomG, this.maxRandomG) / 10;
         }
      }
   }

   addAtoms(color, num) {
      const group = this.groups.find(v => v.color == color);
      for (let i = 0; i < num; i++) {
         this.addAtom(
            group,
            this.random(1, this.width - 1),
            this.random(1, this.height - 1)
         );
      }
      this.sendProps('groups');
   }

   removeAtoms(color, num) {
      const group = this.groups.find(v => v.color === color);
      const groupAtoms = this.groupsAtoms[color];
      for (let i = 0; i < num; i++) {
         groupAtoms.pop();
      }
      group.atomsNum = groupAtoms.length;
      this.sendProps('groups');
   }

   randomGMaps() {
      for (const colorA in this.gMaps) {
         const gMapA = this.gMaps[colorA];
         for (const colorB in gMapA) {
            gMapA[colorB] = this.random(this.minRandomG, this.maxRandomG) / 10;
         }
      }
      this.sendProps('gMaps');
   }

   resetGMaps() {
      for (const colorA in this.gMaps) {
         const gMapA = this.gMaps[colorA];
         for (const colorB in gMapA) {
            gMapA[colorB] = 0;
         }
      }
      this.sendProps('gMaps');
   }

   randomAtomsXY() {
      for (let i = 0; i < this.groups.length; ++i) {
         const group = this.groups[i];
         const groupAtoms = this.groupsAtoms[group.color];
         for (let j = 0; j < groupAtoms.length; ++j) {
            const atom = groupAtoms[j];
            atom.x = this.random(1, this.width - 1);
            atom.y = this.random(1, this.height - 1);
         }
      }
   }

   clearScreen() {
      this.g.clearRect(0, 0, this.width, this.height);
   }

   translate(movementX, movementY) {
      for (let i = 0; i < this.groups.length; ++i) {
         const group = this.groups[i];
         const groupAtoms = this.groupsAtoms[group.color];
         for (let j = 0; j < groupAtoms.length; ++j) {
            const atom = groupAtoms[j];
            atom.x += movementX;
            atom.y += movementY;
         }
      }
   }

   init() {
      this.g = this.offscreenCanvas.getContext('2d');
      this.addGroup('#e11d48', 160);
      this.addGroup('#d97706', 160);
      this.addGroup('#16a34a', 160);
      this.addGroup('#2563eb', 160);
      this.addGroup('#475569', 160);
      this.addGroup('#7c3aed', 160);
      this.addGroup('#0891b2', 160);
      this.addGroup('#c026d3', 160);
      this.addGroup('#e2e8f0', 160);
      this.render();
      this.send('loaded', {
         radius: this.radius,
         minRandomG: this.minRandomG,
         maxRandomG: this.maxRandomG,
         minDistance: this.minDistance,
         maxDistance: this.maxDistance,
         alpha: this.alpha,
         trail: this.trail,
         groups: this.groups,
         gMaps: this.gMaps
      });
   }

   rule(groupA, groupB) {
      let g = this.gMaps[groupA.color][groupB.color];
      const groupAtomsA = this.groupsAtoms[groupA.color];
      for (let i = 0; i < groupAtomsA.length; ++i) {
         const atomA = groupAtomsA[i];
         let fx = 0;
         let fy = 0;
         const groupAtomsB = this.groupsAtoms[groupB.color];
         for (let j = 0; j < groupAtomsB.length; ++j) {
            const atomB = groupAtomsB[j];
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
            if (d && d >= this.minDistance && d <= this.maxDistance) {
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
   }

   render() {
      this.g.globalAlpha = this.trail;
      this.g.fillStyle = '#000';
      this.g.fillRect(0, 0, this.width, this.height);
      this.g.globalAlpha = this.alpha;
      for (let i = 0; i < this.groups.length; ++i) {
         const groupA = this.groups[i];
         for (let j = 0; j < this.groups.length; ++j) {
            const groupB = this.groups[j];
            this.rule(groupA, groupB);
         }
         const groupAtomsA = this.groupsAtoms[groupA.color];
         for (let j = 0; j < groupAtomsA.length; ++j) {
            const atom = groupAtomsA[j];
            this.g.beginPath();
            this.g.fillStyle = atom.color;
            this.g.arc(atom.x, atom.y, this.radius, 0, this.PI_2);
            this.g.fill();
            this.g.closePath();
         }
      }
      requestAnimationFrame(this.render);
   }

   send(name, data, transfers) {
      self.postMessage([name, data], transfers);
   }

   sendProps(...names) {
      const props = {};
      for (const name of names) {
         props[name] = this[name];
      }
      self.postMessage(['props', props]);
   }

   onmessage(event) {
      const [name, data] = event.data;
      switch (name) {
         case 'init':
            Object.assign(this, data);
            this.init();
            break;

         case 'call':
            this[data.name].apply(this, data.args);
            break;

         case 'props':
            Object.assign(this, data);
            break;
      }
   }
}

const worker = new RenderWorker();
