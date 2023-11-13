class RenderWorker {
   constructor() {
      this.PI_2 = Math.PI * 2;
      this.render = this.render.bind(this);
      this.onmessageGlobal = this.onmessageGlobal.bind(this);
      self.addEventListener('message', this.onmessageGlobal);
   }

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
         for (let j = 0; j < groupA.atoms.length; ++j) {
            const atom = groupA.atoms[j];
            this.g.beginPath();
            this.g.fillStyle = atom.color;
            this.g.arc(atom.x, atom.y, this.radius, 0, this.PI_2);
            this.g.fill();
            this.g.closePath();
         }
      }
      requestAnimationFrame(this.render);
   }

   onmessageGlobal(event) {
      const { data } = event;
      switch (data.name) {
         case 'startRender':
            Object.assign(this, data.props);
            this.g = this.offscreenCanvas.getContext('2d');
            this.render();
            break;
         case 'props':
            Object.assign(this, data.props);
            break;
         case 'addAtom':
            break;
      }
   }
}

const worker = new RenderWorker();
